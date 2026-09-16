---
name: mobile-android
description: Builds native Android apps with the Android team's guides — Jetpack Compose UI, adaptive layouts, edge-to-edge, Compose styles, migrating XML views to Compose, Navigation 3 and predictive back; Android Gradle Plugin 9 upgrades, R8 keep rule analysis, profiling with Android Studio and Perfetto, and the Android CLI; Google Play policy compliance, Play Billing upgrades and the Engage SDK; Credential Manager restore and verified email; CameraX and Media3 Cast; App Functions and the ML Kit GenAI Prompt API; Wear OS, Android TV and display glasses. Use when writing, upgrading or auditing native Android (Kotlin) code for any of these topics, even if the user does not name the library.
intents: [performance, release, migration, build, dependency]
stacks: [android]
---

# Mobile Android

Guides for building native Android apps, most of them from the Android team (`android/skills`). Cross-platform topics live in their own skills and have Android references there: architecture in `mobile-architecture`, tests in `mobile-test`, debugging (Gradle, crashes, ANRs) in `mobile-debug`, code review in `mobile-code-review`, security in `mobile-security` and Firebase in `mobile-firebase`.

## Pick the topic

| Topic | Read |
|---|---|
| UI and navigation | [references/ui.md](references/ui.md) |
| Build, performance and tooling | [references/build-and-performance.md](references/build-and-performance.md) |
| Google Play | [references/play.md](references/play.md) |
| Identity | [references/identity.md](references/identity.md) |
| Camera and media | [references/media.md](references/media.md) |
| On-device AI | [references/on-device-ai.md](references/on-device-ai.md) |
| Other form factors | [references/devices.md](references/devices.md) |

Each topic file lists its guides; open only the ones the task needs.

## Before writing code

- Check the AGP, Kotlin, Compose BOM and `compileSdk`/`targetSdk` versions in the build files and version catalog; several guides depend on minimum versions.
- Several guides prescribe running specific tools or scripts and following steps strictly; run what writes files only with the user's agreement.
