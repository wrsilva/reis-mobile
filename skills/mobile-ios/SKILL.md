---
name: mobile-ios
description: Builds native iOS apps in Swift — SwiftUI and UIKit screens, state and data flow, NavigationStack, lists, forms and accessibility; networking with URLSession and Codable, persistence with SwiftData, Core Data, files and the Keychain; permissions, push notifications, universal links, background tasks, widgets, App Intents and StoreKit 2 purchases; performance with Instruments and MetricKit; and release with signing, TestFlight and App Store Connect. Use when writing or changing native iOS code, adding a platform feature, preparing a build for TestFlight or the App Store, or when the user asks how to do something on iOS, even if they do not name the framework.
intents: [performance, release, accessibility]
stacks: [ios]
---

# Mobile iOS

Guides for building native iOS apps. Cross-platform topics live in their own skills and have iOS references there: architecture in `mobile-architecture`, tests in `mobile-test`, debugging (Xcode, CocoaPods, crashes) in `mobile-debug`, code review in `mobile-code-review`, security in `mobile-security` and Firebase in `mobile-firebase`.

## Pick the topic

| Topic | Read |
|---|---|
| SwiftUI and UIKit screens, navigation, lists, forms, accessibility, localization | [references/ui-navigation.md](references/ui-navigation.md) |
| Networking, JSON, persistence, caching, offline | [references/data-networking.md](references/data-networking.md) |
| Permissions, push, universal links, background work, widgets, App Intents, in-app purchases | [references/platform-features.md](references/platform-features.md) |
| Performance, app size, signing, TestFlight and App Store release | [references/performance-release.md](references/performance-release.md) |

## Before writing code

- Check the deployment target (`IPHONEOS_DEPLOYMENT_TARGET`), the Swift language version and the Xcode version: many APIs in these guides need iOS 16 or 17, and Swift 6 changes concurrency checking.
- Follow the project: SwiftUI or UIKit, its architecture, and dependencies already in `Package.resolved` or `Podfile.lock`.
- Apple's requirements change every year (minimum SDK for uploads, privacy manifests, review guidelines); check the current ones instead of relying on these guides for dates or version numbers.
