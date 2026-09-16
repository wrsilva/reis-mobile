# Releasing on Android

Google Play specifics: policy compliance and Play Billing live in `mobile-android` → `references/play.md`; R8 keep rules in its build and performance guides.

## Version

- `versionCode` (integer) must increase with every upload to Play, across all tracks. `versionName` is what users see.
- Set them in `defaultConfig` of `app/build.gradle(.kts)`, or from CI (`-PversionCode=...` read in the build script). Flutter and Expo generate them from their own manifests; see their references.
- When several APKs or bundles share a version (Wear OS, TV, different ABIs), each needs a distinct `versionCode`.

## Build and signing

```bash
./gradlew bundleRelease          # app/build/outputs/bundle/release/app-release.aab
```

- Google Play requires an Android App Bundle (`.aab`) for new apps. Use APKs only for other stores or direct distribution.
- With **Play App Signing**, Google holds the app signing key and you sign uploads with the **upload key**. A lost upload key can be reset through the Play Console; a lost app signing key outside Play App Signing cannot. Check in *Test and release → App integrity* which setup the app uses.
- Keystore passwords and the keystore itself never live in the repository. Read them from environment variables or an untracked `keystore.properties`, and check `.gitignore`.
- Fingerprints for App Links (`assetlinks.json`), Google Sign-In and Firebase come from the **app signing key** shown in the Play Console for Play builds, not from the upload or debug key.

## Symbols

- **R8 mapping** (`app/build/outputs/mapping/release/mapping.txt`) deobfuscates stack traces. Check in the Play Console's App bundle explorer that the deobfuscation file is attached to the version, and upload it when it is not. Crashlytics uploads it through its Gradle plugin. Archive it with the build either way.
- **Native symbols** for apps with C/C++ code: `android { buildTypes { release { ndk { debugSymbolLevel = "FULL" } } } }` (or `"SYMBOL_TABLE"`) adds them to the bundle.

## Before uploading

- [ ] `targetSdk` meets Google Play's current target API level requirement (it moves every year; confirm in the Play Console or the Play policy guide).
- [ ] `isMinifyEnabled` and `isShrinkResources` enabled for release, and the release build tested with them.
- [ ] `android:debuggable` not set, no `usesCleartextTraffic="true"` without a scoped network security config, `android:allowBackup` decided on purpose.
- [ ] New permissions justified; sensitive ones (location in background, SMS, call log, all files access, exact alarms) have the Play declaration they need.
- [ ] Data safety form updated for new SDKs or data collection.
- [ ] Release notes (500 characters per language) ready — see [store-copy.md](store-copy.md).

## Tracks and rollout

- **Internal testing** for fast team builds, **closed testing** for a group of testers, **open testing** for a public beta, **production**.
- New personal developer accounts must run a closed test with a minimum number of testers for a minimum period before applying for production access; check the current numbers in the Play Console.
- Production updates go out as a **staged rollout** (a percentage of users). Increase it while the Android vitals (user-perceived crash rate and ANR rate) stay at the baseline of the previous version; **halt** the rollout when they regress. Halting stops new installs but does not revert users who already updated: the fix is a new build with a higher `versionCode`.
- **Managed publishing** holds approved changes until you publish them, useful to coordinate with a backend release.

## Automation

- `fastlane supply` (`upload_to_play_store`) uploads bundles, notes and listing text with a service account JSON key.
- The Gradle Play Publisher plugin (`com.github.triplet.play`) does the same from Gradle.
- The service account needs access granted in the Play Console (*Users and permissions*), limited to the app and the tracks it publishes to.
