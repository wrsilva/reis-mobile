---
name: mobile-rn
description: Builds React Native and Expo apps in TypeScript — navigation with React Navigation or Expo Router, lists, forms, styling, gestures and animations with Reanimated, safe areas, accessibility and localization; networking with TanStack Query, response validation, persistence with MMKV, AsyncStorage, SQLite and secure storage; permissions, push notifications, deep links, background tasks, native modules and config plugins; performance with Hermes and the React profiler; and release with EAS Build, EAS Submit and EAS Update or bare Gradle and Xcode builds. Use when writing or changing React Native code, adding a native capability, configuring Expo, preparing a store build or an over-the-air update, or when the user asks how to do something in React Native, even if they do not name the library.
intents: [performance, release, accessibility]
stacks: [react-native]
---

# Mobile React Native

Guides for building React Native and Expo apps. Cross-platform topics live in their own skills and have React Native references there: architecture and state in `mobile-architecture`, tests in `mobile-test`, debugging (Metro, native modules, builds) in `mobile-debug`, code review in `mobile-code-review`, security in `mobile-security` and Firebase in `mobile-firebase`.

## Pick the topic

| Topic | Read |
|---|---|
| Navigation, lists, forms, styling, gestures, animations, accessibility, localization | [references/ui-navigation.md](references/ui-navigation.md) |
| Networking, server state, validation, persistence, offline | [references/data-networking.md](references/data-networking.md) |
| Permissions, push, deep links, background work, native modules, config plugins | [references/platform-features.md](references/platform-features.md) |
| Performance, bundle, EAS Build, store submission and over-the-air updates | [references/performance-release.md](references/performance-release.md) |

## Before writing code

- Detect the setup: Expo (managed with Continuous Native Generation, or with committed `android/` and `ios/`) or bare React Native; the React Native and Expo SDK versions; whether the New Architecture is enabled.
- Install libraries with `npx expo install` in Expo projects, so versions match the SDK.
- Libraries with native code need a new native build (a development build in Expo); they do not work in Expo Go unless the Expo SDK includes them.
- Native requirements of each platform still apply; see `mobile-ios` and `mobile-android` for store and platform specifics.
