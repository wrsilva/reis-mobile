# Google Analytics for Firebase — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

## Package product

`FirebaseAnalytics` — `import FirebaseAnalytics`

The Firebase package offers Analytics products with and without advertising identifier (IDFA) support; pick the one that matches whether the app requests App Tracking Transparency, and keep the privacy manifest and App Store privacy answers consistent with it.

## Events

```swift
Analytics.logEvent(AnalyticsEventSelectItem, parameters: [
    AnalyticsParameterItemID: item.id,
    AnalyticsParameterItemName: item.name,
])
```

- Prefer recommended events and parameters (`AnalyticsEvent*`, `AnalyticsParameter*`) before custom ones.
- Custom names: letters, digits and underscores, starting with a letter; check current length and count limits before designing a schema.
- Never log personal data as parameters or user properties.
- SwiftUI screens: `.analyticsScreen(name:)` on the view, or log `AnalyticsEventScreenView` with `AnalyticsParameterScreenName`. UIKit view controllers are tracked automatically unless disabled.

## Consent and debugging

- Consent: `Analytics.setConsent([.analyticsStorage: .granted])` after the user decides.
- DebugView: add `-FIRDebugEnabled` to the scheme's launch arguments (`-FIRDebugDisabled` to turn it off).

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
