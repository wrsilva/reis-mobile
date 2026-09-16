# CI/CD for mobile apps

## Pipeline shape

| Trigger | Jobs |
|---|---|
| Pull request | Static analysis or lint, unit tests, a debug or release build per platform that compiles (no signing, no upload) |
| Merge to the main branch | The above, plus a signed build uploaded to internal testing (Play internal track, TestFlight internal) |
| Release tag (`v1.4.0`) | Signed release builds, symbol upload, upload to the release track, artifacts attached to the release |

Keep Android and iOS in separate jobs: Android runs on Linux runners, iOS needs macOS runners, which cost more and are slower — do not run iOS builds on every push if the team does not need them.

## Principles

- **Reproducible toolchain.** Pin the Flutter version, Node version, JDK, Xcode version (`sudo xcode-select -s /Applications/Xcode_<version>.app` or the runner image's documented selector) and Ruby/fastlane through `Gemfile.lock`. CI that builds with a different toolchain than developers is how "works on my machine" reaches the store.
- **Caching.** Gradle (`~/.gradle/caches`, or `gradle/actions/setup-gradle`), pub cache, `node_modules` keyed by the lock file, CocoaPods `Pods/` keyed by `Podfile.lock`. Never cache build outputs across different commits for release builds.
- **Secrets.** Keystore as a base64 CI secret decoded to a temporary file; keystore passwords, the Play service account JSON, the App Store Connect API key (`.p8`, key ID, issuer ID) and `match` passwords as secrets. Nothing written to logs; files deleted at the end of the job. Release jobs run only on protected branches or tags, so a pull request from a fork cannot read them.
- **Build numbers from CI.** Derive the build number from the run number or the store's latest build (fastlane `latest_testflight_build_number`, `google_play_track_version_codes`) instead of committing a bump on every build.
- **Artifacts.** Keep the `.aab`/`.ipa`, the R8 mapping, dSYMs, Dart symbols and source maps for every release build.
- **One way to ship.** Once CI publishes, nobody uploads from a laptop: a manual upload skips the checks and breaks the build number sequence.

## GitHub Actions sketch (Flutter, Android)

Adapt names and versions to the project; check each action's current major version in its repository.

```yaml
name: android-release
on:
  push:
    tags: ['v*']

jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
      - uses: subosito/flutter-action@v2
        with:
          flutter-version-file: pubspec.yaml   # or a pinned flutter-version
          cache: true
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test
      - name: Decode keystore
        run: |
          echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > android/app/upload.jks
          cat > android/key.properties <<EOF
          storeFile=upload.jks
          storePassword=$ANDROID_KEYSTORE_PASSWORD
          keyAlias=$ANDROID_KEY_ALIAS
          keyPassword=$ANDROID_KEY_PASSWORD
          EOF
        env:
          ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
      - run: flutter build appbundle --release --build-number=${{ github.run_number }} --obfuscate --split-debug-info=build/symbols
      - uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: |
            build/app/outputs/bundle/release/app-release.aab
            build/app/outputs/mapping/release/mapping.txt
            build/symbols
```

`flutter-version-file` reads the version from the `environment.flutter` constraint only when it is an exact version; otherwise pin `flutter-version`. Upload to Play in a following step with fastlane `supply` or an upload action, using the service account secret.

## fastlane

- `Fastfile` lanes per platform: `beta` (build, upload to internal testing or TestFlight) and `release` (upload to production or submit for review).
- iOS signing: `match` (certificates and profiles in an encrypted store) with `readonly: true` in CI; `app_store_connect_api_key` for authentication instead of an Apple ID with two-factor authentication.
- Android upload: `upload_to_play_store(track: 'internal', aab: ...)` with `json_key_data` from a secret.
- Run with `bundle exec fastlane <lane>` so CI uses the fastlane version in `Gemfile.lock`.

## Other services

- **EAS (Expo):** `eas build` and `eas submit` run on Expo's builders; trigger them from CI with `EXPO_TOKEN`, or use EAS Workflows. `eas update` in CI publishes over-the-air updates — gate it like a release.
- **Codemagic, Bitrise, Xcode Cloud, Azure DevOps, GitLab CI:** the same pipeline shape applies; prefer the service's managed code signing when the team already uses it, and keep secrets in the service's encrypted variables.

## Reviewing an existing pipeline

- [ ] Toolchain versions pinned and matching local development.
- [ ] Secrets never printed (`set -x`, `cat` of decoded files, verbose tool flags) and not available to untrusted pull requests.
- [ ] Release jobs restricted to tags or protected branches.
- [ ] Tests run before the signed build, and a failure stops the upload.
- [ ] Symbols and mapping files uploaded or archived for every release build.
- [ ] Build numbers cannot collide between parallel runs or re-runs.
- [ ] Third-party actions pinned to a version (or a commit SHA for sensitive jobs).
