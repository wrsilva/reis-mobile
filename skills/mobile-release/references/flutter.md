# Releasing a Flutter app

A Flutter release is an Android release and an iOS release produced by the Flutter tool. Store details, signing and rollout follow [android.md](android.md) and [ios.md](ios.md); this guide covers what Flutter changes.

## Version

- `pubspec.yaml` holds both numbers: `version: 1.4.0+42` → version name `1.4.0`, build number `42`.
- On Android it becomes `versionName`/`versionCode` through `flutter.versionName` and `flutter.versionCode` in `android/app/build.gradle(.kts)`. On iOS it becomes `FLUTTER_BUILD_NAME`/`FLUTTER_BUILD_NUMBER`, which `Info.plist` must reference (`$(FLUTTER_BUILD_NAME)`, `$(FLUTTER_BUILD_NUMBER)`). Check both files: a hard-coded value there silently ignores `pubspec.yaml`.
- CI can override without editing the file: `--build-name=1.4.0 --build-number=$GITHUB_RUN_NUMBER`.

## Build

```bash
flutter build appbundle --release --obfuscate --split-debug-info=build/symbols
flutter build ipa --release --obfuscate --split-debug-info=build/symbols \
  --export-options-plist=ios/ExportOptions.plist
```

- `--obfuscate` requires `--split-debug-info`. The symbol files in that folder are per build and per architecture: archive them with the build or stack traces from that release cannot be read.
- Symbolize a stack trace with `flutter symbolize -i trace.txt -d build/symbols/app.android-arm64.symbols`. Crashlytics needs the symbols uploaded (`firebase crashlytics:symbols:upload --app=<firebase-app-id> build/symbols`).
- Obfuscation renames Dart types: code that relies on `runtimeType.toString()` or type names in logs and analytics changes behavior in release.
- Pass environment configuration with `--dart-define` or `--dart-define-from-file`, and check which file the release command uses. Anything passed this way is in the binary: no secrets.
- Android signing: `android/key.properties` (untracked) read by the `signingConfigs.release` block. A release build that falls back to `signingConfig = signingConfigs.debug` — the default in new projects — is rejected by Play and must be caught before upload.

## Before uploading

- [ ] `flutter analyze` and `flutter test` pass on the release commit.
- [ ] The app runs in `--release` (or `--profile`) on a real device: assertions, `kDebugMode` branches and the debug banner behave differently in debug.
- [ ] `debugPrint` and logging do not print sensitive data in release.
- [ ] Plugins that need platform setup for release are configured: Android permissions and R8 keep rules some plugins document, iOS usage descriptions, `Podfile` platform version.
- [ ] `flutter build ipa` warnings about the app icon, launch image or bundle identifier are resolved.
- [ ] App size checked (`--analyze-size`) when the release adds assets or packages.

## Automation

- fastlane lanes in `android/` and `ios/` run after `flutter build`, or call it themselves.
- Codemagic and GitHub Actions with `subosito/flutter-action` are common CI setups; pin the Flutter version to the one the team uses locally (`.fvmrc` or a documented version) so CI builds what was tested. See [ci-cd.md](ci-cd.md).
