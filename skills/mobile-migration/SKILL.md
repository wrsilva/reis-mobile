---
name: mobile-migration
description: Plans and executes mobile migrations across Flutter, Android, iOS, React Native and Kotlin Multiplatform. Use for SDK, toolchain and library upgrades, moves such as XML views to Compose, UIKit to SwiftUI, a state library swap or the React Native New Architecture, and on-device data migrations that must survive app updates. Builds that fail after an upgrade belong to mobile-debug.
intents: [migration]
stacks: ["*"]
---

# Mobile Migration

A mobile migration ships to users who update from many old versions, cannot downgrade from the store and keep their data on the device. Reuse the [project brief](../../docs/agent-context.md) and record the current state from wrappers, lock files and CI images, not from declared version ranges. When the migration breaks a build, diagnose it with [mobile-debug](../mobile-debug/SKILL.md).

## Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Android | [references/android.md](references/android.md) |
| iOS | [references/ios.md](references/ios.md) |
| React Native / Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |

Flutter and React Native apps also need the Android and iOS references for their native layers.

## Write the compatibility contract first

Before editing, record:

- Current and target versions from verified sources (lock file, wrapper, the target's release notes and migration guide), and every version crossed between them.
- Minimum OS versions before and after. Raising one stops delivering updates to older devices; make it an explicit decision.
- Persisted formats on the device: database schema version, preference keys, files, Keychain or Keystore items and cached serialized models.
- Contracts with installed versions: backend API versions old apps still call, deep links, push payloads and the minimum app version the backend supports.
- Generated code, native modules and plugins affected, with their support for the target.
- What must stay unchanged unless changing it is the objective: state, storage and public API.

## Plan buildable steps

- Each step builds, passes tests and could ship on its own. Separate the toolchain upgrade, the code modernization and any behavior change into different steps.
- Upgrade dependencies in coherent groups, not all at once, so one failure points at one cause.
- Use the official migration tools where they exist and review their diff: `dart fix`, the AGP Upgrade Assistant in Android Studio, React Native Upgrade Helper, `npx expo install --fix` and per-target concurrency checking in Xcode.
- For incremental UI or architecture moves, keep an interop boundary (a Compose view inside a View hierarchy, `UIHostingController`, one feature behind its existing repository interface) and migrate leaf screens first. Delete the old path as an explicit final step.
- During a state library swap, two owners for the same data produce divergent state. Move one feature's data at a time.

## On-device data migrations

- Users skip releases. Every schema version from the oldest supported install to the new one needs a migration path; test from each, not only from the previous release.
- Destructive fallback, dropping and recreating the store, is acceptable only for caches the app can refetch, and it must be explicit.
- A migration interrupted by process death, low battery or a launch-time kill must leave the old or the new state, never a mix. Run it in a transaction, make a rerun safe and record completion after the data is written.
- Long migrations block launch. Keep launch-time work bounded, move heavy work off the main thread and show progress when the user must wait; the iOS watchdog terminates apps that launch too slowly.
- The next release must read what this one writes. A staged rollout can be halted, but devices that received the build keep it, and a hotfix ships as a newer version that starts from their data.
- Secure storage outlives assumptions: Keychain items can survive app deletion, and a changed encryption scheme must read old data or reset it deliberately.

## Roll out and verify

Ship behind a staged rollout or phased release and watch crash-free sessions and migration failures by version with [mobile-observability](../mobile-observability/SKILL.md). Store binaries cannot be rolled back, so plan a fix forward. An over-the-air update must not cross a native boundary.

Verify each step with the original build and test commands. For data changes, install the previous store build or tag, create representative data, install the new build over it and check the data. Repeat from the oldest supported version, after a fresh install and with the migration killed midway.

Return the compatibility contract, the step list with each step's evidence, the upgrade-install results and anything not verified, such as backend support for old versions.

## Official sources

- [Flutter breaking changes](https://docs.flutter.dev/release/breaking-changes)
- [Room database migrations](https://developer.android.com/training/data-storage/room/migrating-db-versions)
- [Swift 6 migration guide](https://www.swift.org/migration/documentation/migrationguide/)
- [Upgrading React Native](https://reactnative.dev/docs/upgrading)
