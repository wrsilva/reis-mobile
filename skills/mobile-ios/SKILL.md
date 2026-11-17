---
name: mobile-ios
description: Builds native iOS apps in Swift — SwiftUI and UIKit screens, navigation, state, accessibility and SwiftUI reviews (SwiftUI Pro); URLSession, SwiftData, Core Data and the Keychain; push, universal links, widgets, App Intents and StoreKit 2; Instruments; signing, TestFlight and the App Store. Use for any native iOS code, even if the framework is not named.
intents: [design, performance, release, accessibility]
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
| Reviewing or writing SwiftUI: deprecated and modern API, views and animation, data flow, navigation, HIG design, resizable windows, accessibility, localization, performance and Swift hygiene (SwiftUI Pro, by Paul Hudson) | [references/swiftui-pro/GUIDE.md](references/swiftui-pro/GUIDE.md) |

The SwiftUI Pro guide lives in its own folder with its references; the `references/...` paths it mentions refer to that folder. Load only the references the task needs.

## Before writing code

- Check the deployment target (`IPHONEOS_DEPLOYMENT_TARGET`), the Swift language version and the Xcode version: many APIs in these guides need iOS 16 or 17, and Swift 6 changes concurrency checking.
- Follow the project: SwiftUI or UIKit, its architecture, and dependencies already in `Package.resolved` or `Podfile.lock`.
- Apple's requirements change every year (minimum SDK for uploads, privacy manifests, review guidelines); check the current ones instead of relying on these guides for dates or version numbers.

## Interface design

For UI/UX reviews, wireframes, design systems and screen redesigns, use [mobile-ui-ux](../mobile-ui-ux/SKILL.md) and its reference for this stack. For Apple targets, also consult its [Apple design workflow](../mobile-ui-ux/references/apple-design.md); validate platform claims against current official guidance and the installed toolkit.
