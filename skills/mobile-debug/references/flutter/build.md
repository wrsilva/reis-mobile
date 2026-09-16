# Flutter Build Debug

A Flutter build runs four toolchains in sequence: pub, the Dart compiler, Gradle for Android and Xcode with CocoaPods for iOS. The error message comes from one of them, and the fix belongs to that one. Identify the layer first.

## 1. Which layer failed

| Output contains | Layer | Next step |
|---|---|---|
| `version solving failed`, `Because X depends on Y` | pub | Section 3 |
| `lib/...dart:LINE:COL: Error:` | Dart compiler | Section 4 |
| `FAILURE: Build failed with an exception`, `Execution failed for task`, `Gradle task assembleDebug failed` | Android / Gradle | Section 5, then [../android/gradle-build.md](../android/gradle-build.md) |
| `Xcode build done` with errors, `Error (Xcode):`, `pod install` output | iOS / Xcode / CocoaPods | Section 6, then [../ios/xcode-build.md](../ios/xcode-build.md) or [../ios/cocoapods.md](../ios/cocoapods.md) |

`flutter run -v` or `flutter build <target> -v` prints the underlying tool output when the summary is not enough.

## 2. Versions

- [ ] `flutter --version` and `flutter doctor -v`: Flutter and Dart versions, the Android SDK and the Java binary Flutter uses for Gradle, and the Xcode and CocoaPods versions.
- [ ] `environment: sdk:` (and `flutter:`) in `pubspec.yaml` against the installed Dart and Flutter versions.
- [ ] A version manager (FVM: `.fvmrc` or `.fvm/`, or asdf) → the project may pin a Flutter version different from the global `flutter`. Use the pinned one.
- [ ] CI uses the same Flutter version as the developer's machine; a mismatch explains "works locally, fails on CI".

## 3. pub

- [ ] `The current Dart SDK version is X. Because app requires SDK version >=Y, version solving failed.` → upgrade Flutter or lower the constraint; do not do both blindly.
- [ ] `Because A depends on B ^1.0.0 and C depends on B ^2.0.0, version solving failed` → `flutter pub outdated` shows which package can move. Upgrade the package with the older constraint. `dependency_overrides` is a temporary workaround; if used, add a comment with the reason.
- [ ] Private or `git:` dependencies failing to fetch → authentication or a `ref` that no longer exists.

## 4. Dart compilation and generated code

- [ ] Errors in `*.g.dart`, `*.freezed.dart` or `*.mocks.dart`, or `isn't defined` for generated members → the generated code is stale: `dart run build_runner build --delete-conflicting-outputs`.
- [ ] Errors inside a package in `~/.pub-cache` after upgrading Flutter → the package version does not support this Flutter or Dart version; upgrade the package rather than editing the cache.
- [ ] Breaking changes after a Flutter upgrade → check the Flutter breaking changes page for the version range, and `dart fix --dry-run` for automated migrations.

## 5. Android side

Collect the versions in `android/`: Gradle in `gradle/wrapper/gradle-wrapper.properties`, AGP and Kotlin in `settings.gradle(.kts)` (`plugins {}` block) or the root `build.gradle`, and the JDK from `flutter doctor -v`.

- [ ] Flutter prints warnings such as `Your project's Android Gradle Plugin version (X) will soon be dropped` or a minimum Kotlin or Gradle version → Flutter checks these at build time. Upgrade to at least what the message asks, following the Flutter migration guide for that version.
- [ ] `You are applying Flutter's main Gradle plugin imperatively using the apply script method` → the project uses the old `apply from: .../flutter.gradle` setup. Migrate to the declarative `plugins {}` block described in Flutter's "Deprecated imperative apply of Flutter's Gradle plugins" guide.
- [ ] Wrong JDK → `flutter config --jdk-dir <path>` points Flutter at a specific JDK; check `flutter doctor -v` again afterwards.
- [ ] A plugin requiring a higher `minSdk` or `compileSdk` → set it in `android/app/build.gradle(.kts)`. `flutter.minSdkVersion` is Flutter's default, which a plugin may exceed.
- For anything else in Gradle, apply [../android/gradle-build.md](../android/gradle-build.md).

## 6. iOS side

- [ ] `pod install` errors or `CocoaPods not installed` → apply [../ios/cocoapods.md](../ios/cocoapods.md). Run pod commands from `ios/`.
- [ ] `Module 'x' not found` in Xcode → open `ios/Runner.xcworkspace`, not `Runner.xcodeproj`.
- [ ] Deployment target conflicts → `platform :ios` in `ios/Podfile` and `IPHONEOS_DEPLOYMENT_TARGET` in the Runner project must be at least what the plugins require.
- [ ] Signing errors on `flutter build ipa` → apply [../ios/xcode-build.md](../ios/xcode-build.md).

## 7. Cleaning, with confirmation

`flutter clean` deletes `build/` and `.dart_tool/`; the next build is slower and `flutter pub get` must run again. It fixes stale build outputs, not version conflicts, so propose it only when the evidence points to stale artifacts and after the version checks above. On iOS, deleting `ios/Pods` and `ios/Podfile.lock` changes pod versions: propose it separately, explaining that consequence. Run neither without the user's confirmation.

## Output

Report the failing layer, the first real error, the Flutter, Dart and native toolchain versions involved, the cause with evidence (`file:line` or log line) and the minimal fix, in the order to apply it. If the fix requires upgrading Flutter, AGP, Gradle or the iOS deployment target, state what else that upgrade affects.
