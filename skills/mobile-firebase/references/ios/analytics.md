# Google Analytics for Firebase — native iOS (Swift)

Project setup shared by every Firebase product is in [../ios.md](../ios.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
