# Analytics on iOS

- Inventory the SDKs linked into the app and its extensions, what they collect at launch and what their privacy manifests declare. When Firebase collection must wait for consent, set `FIREBASE_ANALYTICS_COLLECTION_ENABLED` to `NO` in `Info.plist` and call `Analytics.setAnalyticsCollectionEnabled(true)` after consent.
- In SwiftUI, `.onAppear` runs again on tab switches and back navigation. Decide what a screen view means and log it from the navigation owner or with the SDK's screen modifier, not from `body`.
- Keep App Tracking Transparency separate from analytics consent: request ATT only when the data use is tracking, and never infer one from the other.
- Firebase consent, screen views and DebugView are in the [Firebase Analytics reference](../../mobile-firebase/references/ios/analytics.md).
- Reset the analytics identity during sign-out. Test event emission with a fake analytics protocol, and confirm delivery with the destination's debug view.

Official references: [configure data collection](https://firebase.google.com/docs/analytics/configure-data-collection?platform=ios), [user privacy and data use](https://developer.apple.com/app-store/user-privacy-and-data-use/).
