---
name: mobile-kmp
description: Works on Kotlin Multiplatform mobile projects with shared Kotlin source sets and Android/iOS targets. Use for architecture, tests, debugging, reviews, performance, security, accessibility, dependencies and releases when `org.jetbrains.kotlin.multiplatform` is applied; inspect actual targets, `commonMain`/`commonTest`, target source sets, Compose Multiplatform and the iOS framework/host app before giving platform advice. Includes in-depth guides for KMP architecture and code reviews, feature implementation, modularization, state holders, shared Compose UI, adaptive layouts, navigation, `expect`/`actual` bridges, App Links, data layers, tests, Gradle governance, bug fixes and safe refactoring.
intents: [design, architecture, test, performance, review, debug, security, release, accessibility, migration, dependency, build, deployment]
stacks: [kotlin-multiplatform]
---

# Kotlin Multiplatform

KMP is a sharing mechanism, not a promise that both apps use the same UI or SDK. Resolve the module and target graph before choosing Android, iOS or shared-code guidance.

| Question | Read |
|---|---|
| Which code and dependencies can be shared? | [references/source-sets.md](references/source-sets.md) |
| How does shared Kotlin reach the iOS app? | [references/apple-interop.md](references/apple-interop.md) |
| Is UI shared with Compose Multiplatform or native on each target? | [references/compose-ui.md](references/compose-ui.md) |
| Which build, measurement or release task applies? | [references/build-performance.md](references/build-performance.md) |

## Guides by theme

Fifteen in-depth guides, from `mmiani/kotlin-kmp-claude-agent-skills`. They refer to each other by their upstream names (`kotlin-...`), which are the link texts in these tables. Open only the guides the task needs.

| Theme | Read |
|---|---|
| Architecture review, implemented-code review, feature implementation, modularization, state holders | [references/architecture.md](references/architecture.md) |
| Shared Compose UI, adaptive layouts and resources, navigation | [references/ui-navigation.md](references/ui-navigation.md) |
| `expect`/`actual` and platform bridges, Android deep links and App Links | [references/platform.md](references/platform.md) |
| Data layer, test strategy, Gradle build governance | [references/data-testing-build.md](references/data-testing-build.md) |
| Bug fixes and safe refactoring | [references/bugfix-refactoring.md](references/bugfix-refactoring.md) |

## Ground the answer

1. Read `settings.gradle.kts`, the affected module's `build.gradle.kts`, version catalog and source-set directories. Record the configured targets; `androidMain` and `iosMain` are not proof that a target is built in CI.
2. Trace a real symbol from `commonMain` through an interface or `expect` declaration to each configured implementation and its Android/iOS caller. Name the module, source set and owner at every boundary. For shared Compose UI, trace its host entry too.
3. Match validation to the changed boundary: shared Kotlin tests on configured targets, target tests for `actual` implementations, and host UI/device tests for behavior that crosses into Android or iOS. A JVM test is not iOS coverage.
4. Use the topic skill for the requested work. Use `mobile-android` or `mobile-ios` only for an affected host or target-specific implementation; do not apply native-app instructions blindly to `commonMain`.

The [Kotlin Multiplatform source-set reference](https://kotlinlang.org/docs/multiplatform/multiplatform-dsl-reference.html) defines `commonMain`, `commonTest` and target compilations. Confirm DSL and task names in the project's installed Kotlin and Gradle versions.

## Interface design

For UI/UX reviews, wireframes, design systems and screen redesigns, use [mobile-ui-ux](../mobile-ui-ux/SKILL.md) and its reference for this stack. For Apple targets, also consult its [Apple design workflow](../mobile-ui-ux/references/apple-design.md); validate platform claims against current official guidance and the installed toolkit.
