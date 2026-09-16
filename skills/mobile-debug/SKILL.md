---
name: mobile-debug
description: Finds the cause of failing builds and runtime errors in mobile apps on every stack — Flutter (pub version solving, Dart compilation, generated code, layout overflows, runtime exceptions), native Android (Gradle, AGP, JDK and Kotlin mismatches, dependency conflicts, manifest merger, R8, logcat crashes, ANRs and memory leaks), native iOS (Xcode signing and provisioning, deployment targets, CocoaPods, Swift Package Manager, crash logs) and React Native (Metro, native modules not found, Hermes, the Android and iOS builds underneath), plus deep links, App Links and Universal Links that do not open the app. Use whenever a build, `flutter run`, `pod install`, Gradle task, Xcode archive or app launch fails, when the user pastes a stack trace, "BUILD FAILED" or a red screen, or runs /reis-mobile:debug, even if they only paste the error.
intents: [debug, build, dependency, migration]
stacks: ["*"]
---

# Mobile Debug

One debugging process for every mobile stack. This file holds how to find a cause; each platform's error signatures and fixes live in its reference.

## 1. Pick the reference

Choose by the stack **and** by the layer the error comes from — a Flutter or React Native build often fails inside Gradle or Xcode:

| The failure is in | Read |
|---|---|
| A Flutter app: pub, Dart compilation, generated code, widgets, runtime exceptions | [references/flutter.md](references/flutter.md) |
| Gradle, the Android build, logcat crashes or ANRs (native Android, or the `android/` folder of any app) | [references/android.md](references/android.md) |
| Xcode, signing, CocoaPods, Swift packages or iOS crash logs (native iOS, or the `ios/` folder of any app) | [references/ios.md](references/ios.md) |
| A React Native or Expo app: Metro, native modules, JavaScript errors | [references/react-native.md](references/react-native.md) |
| A deep link, App Link or Universal Link that opens the browser, the wrong screen or crashes (any stack) | [references/deep-links.md](references/deep-links.md) |

When `reis-mobile debug` (or `/reis-mobile:debug`) ran, its `area` line points at the layer: `gradle`, `manifest`, `proguard` → Android; `xcode`, `signing`, `cocoapods`, `spm` → iOS; `pub` → Flutter; `metro` → React Native.

## 2. Find the first real error

Build and crash logs bury the cause under cascading failures. Quote the line that starts the failure — the first `error:`, the `What went wrong` block, the top of the exception with its `Caused by` — not the final `BUILD FAILED` or the last frame. Ask for the full output when the user pasted only the end.

## 3. Collect versions before theorizing

Most build failures after an upgrade are toolchain mismatches. Read the versions that decide the behavior — the SDK and toolchain versions (the doctor report shows them), wrapper and lock files, build scripts, deployment targets — and quote them in the diagnosis. Check compatibility against the official tables named in the reference; do not state compatibility ranges from memory.

## 4. Reproduce safely

Read-only commands can run: version checks, dependency trees, `flutter doctor -v`, `./gradlew --version`, `pod --version`, `xcodebuild -version`. A build that only compiles can run when the user already ran it or agrees, since it takes time and writes build outputs.

## 5. Confirm the cause

Tie the cause to evidence: `file:line`, a version, a build setting or a log line. If two causes are plausible, say what evidence would separate them instead of picking one.

## 6. Propose, then wait

Answer with:

- **Cause** — one or two sentences, with the evidence.
- **Fix** — the minimal change, as a diff or exact commands, in order.
- **Side effects** — what else the fix changes: a higher minimum Android or iOS version, a Gradle or Kotlin upgrade that CI needs too, pods changing version.
- **Verify** — the command that failed, run again.

Do not edit files, upgrade dependencies or run commands that change the project, the caches or the machine — `flutter clean`, `pod install`, `pod repo update`, `npx expo prebuild --clean`, deleting `DerivedData`, `~/.gradle` caches or `node_modules` — until the user asks you to apply the fix. Then apply it, run the verification and report the result.
