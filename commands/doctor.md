---
description: Diagnoses the mobile environment (Flutter, Android SDK, Java, Xcode, CocoaPods, Node...) and the configuration of the detected project
argument-hint: "[--all] [--dir <path>]"
allowed-tools: ["Bash(node:*)", "Read"]
---

# reis-mobile doctor

Diagnostic result:

!`node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" doctor $ARGUMENTS`

## Instructions

1. Show the report above to the user exactly as it came, inside a code block.
2. For each line marked with `✗`, explain in one sentence the likely cause and the command to fix it, taking the operating system and the detected stack into account. Examples:
   - `pubspec.lock missing` → `flutter pub get`
   - `Podfile.lock missing` → `cd ios && pod install`
   - `Android SDK not found` → install it through Android Studio and export `ANDROID_HOME`
   - `Java` failing in a Flutter project → `flutter doctor -v` shows which JDK Flutter uses; the `java` on the PATH may be a different one
3. Do not run install or fix commands unless the user asks.
4. If there is no `✗`, just say the environment is ready for the detected stack.
5. Write the explanations in the language on the report's `Language` line (`en` English, `pt` Brazilian Portuguese). With `-`, use the language of the user's request. The report itself stays exactly as it came.
