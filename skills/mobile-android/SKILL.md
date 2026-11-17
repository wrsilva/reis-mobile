---
name: mobile-android
description: Builds native Android apps with the Android team's guides — Jetpack Compose, adaptive and edge-to-edge UI, Navigation 3 and XML to Compose; AGP 9, R8 and Perfetto profiling; Play policy, Play Billing and Engage; Credential Manager; CameraX and Media3; on-device AI; Wear OS and TV. Use for native Android (Kotlin) code, even if the library is not named.
intents: [design, performance, release, migration, build, dependency]
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

## Interface design

For UI/UX reviews, wireframes, design systems and screen redesigns, use [mobile-ui-ux](../mobile-ui-ux/SKILL.md) and its reference for this stack. For Apple targets, also consult its [Apple design workflow](../mobile-ui-ux/references/apple-design.md); validate platform claims against current official guidance and the installed toolkit.
