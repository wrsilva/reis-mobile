# Firebase In-App Messaging — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

## Package product

`FirebaseInAppMessaging-Beta` (the Swift package still labels the product beta) — `import FirebaseInAppMessaging`. Add `FirebaseAnalytics` too: campaigns are triggered by Analytics events.

## Usage

```swift
InAppMessaging.inAppMessaging().messageDisplaySuppressed = true   // during flows that must not be interrupted
InAppMessaging.inAppMessaging().messageDisplaySuppressed = false
InAppMessaging.inAppMessaging().triggerEvent("checkout_completed")
```

## Notes

- Messages display on the next foreground after they are fetched, not immediately after publishing a campaign.
- To preview a campaign, use **Test on device** in the console with the Firebase Installation ID (`try await Installations.installations().installationID()`).
- A custom look requires implementing `InAppMessagingDisplay` and setting it as the display component.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
