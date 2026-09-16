---
description: Mobile debugging — routes a build or runtime failure (Gradle, Xcode, CocoaPods, Flutter) to the right agent and skills, finds the cause with evidence and proposes the fix
argument-hint: "<error message, failing command or description of the problem>"
allowed-tools: ["Bash(node:*)", "Bash(git:*)", "Bash(flutter:*)", "Bash(dart:*)", "Bash(./gradlew:*)", "Bash(xcodebuild:*)", "Bash(pod:*)", "Bash(java:*)", "Read", "Grep", "Glob"]
---

# reis-mobile debug

Arguments received: `$ARGUMENTS`

The arguments are the problem: an error message, the command that fails, or a description. Without them, ask the user for the failing command and its full output, and stop. A debug session without the actual error guesses; one with it verifies.

## 1. Route and gather the toolchain

Run via Bash, with correct quoting:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" debug --dir "$PWD" -- "<problem>"
```

The output reports:

- `Project`, when `.reis-mobile/config.yaml` points the command at an app folder;
- `Intent`, `Stack`, `focus` and `area` (`gradle`, `xcode`, `cocoapods`, `signing`, `pub`...);
- `Agent` and `Skills`, in priority order;
- `Language`, the language to answer in (see **Language**);
- the doctor checks: installed tools and their versions, lock files, Gradle wrapper, iOS deployment target.

If the command fails, show the error to the user and stop.

## Language

The CLI output has a `Language` line. Write everything the user reads in that language: `en` is English, `pt` is Brazilian Portuguese. With `-`, use the language of the user's request. Code, identifiers, file paths, commands and quoted tool output stay as they are.

## 2. Load the instructions

Read with the Read tool, in this order:

1. `${CLAUDE_PLUGIN_ROOT}/agents/<Agent>.md`;
2. `${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md` for each listed skill. The first skills are the most specific to the stack and area; read them all, since a failure often crosses layers (a Flutter build that fails inside Gradle).

## 3. Diagnose

Follow the agent's process and the skills' checklists:

1. **Find the first real error.** Build logs bury it under cascading failures. Quote the line that starts the failure, not the last `BUILD FAILED`.
2. **Read the files that decide the behavior** before forming a theory: build scripts, wrapper and lock files, manifests, `Info.plist`, `Podfile`, project settings. Compare versions against the doctor output — a mismatch between the JDK, Gradle, AGP, Kotlin, Xcode or CocoaPods is the most common cause.
3. **Reproduce when it is safe.** Read-only commands can run: `./gradlew --version`, `flutter --version`, `pod --version`, `xcodebuild -version`, `./gradlew :app:dependencies`. A build that only compiles (`./gradlew assembleDebug`, `flutter build apk --debug`) can run if the user already ran it or agrees, since it takes time and writes build outputs.
4. **Confirm the cause** with evidence at `file:line` or in the log. If two causes are plausible, say which evidence would separate them instead of picking one.

## 4. Propose, then wait

Answer with:

- **Cause:** one or two sentences, with the evidence.
- **Fix:** the minimal change, as a diff or the exact commands, in the order to apply them.
- **Why it works**, and what it changes beyond the error (a Gradle or Kotlin upgrade, a new minimum iOS version).
- **How to verify:** the command that failed, run again.

Do not edit files or run commands that change the project or the machine — `flutter clean`, `pod install`, `pod repo update`, deleting `DerivedData` or `~/.gradle` caches, dependency upgrades — until the user asks you to apply the fix. Once they do, apply it, run the verification command and report the result.
