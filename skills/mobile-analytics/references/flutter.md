# Analytics in Flutter

- Confirm the SDK in `pubspec.lock` and the native SDK it wraps. Native code can collect automatic events before `runApp`, so disable that natively when collection must wait for consent. For Firebase, use the [Firebase Analytics reference](../../mobile-firebase/references/flutter/analytics.md) and the native switches in [Android](android.md) and [iOS](ios.md).
- Keep one Dart analytics interface with typed events, injected where the state owners can reach it. Do not call the SDK from `build()`: rebuilds repeat it.
- Track screen views with a navigator observer on the app's router (`FirebaseAnalyticsObserver` for Firebase) or from the router's route-change callback.
- Fire conversion events from the state owner after the repository confirms the outcome, not from the button callback.
- On sign-out, reset the SDK identity in the same flow that clears account data.
- Test with a fake analytics implementation in unit and widget tests, and confirm delivery on device builds.

Official reference: [FirebaseAnalyticsObserver](https://pub.dev/documentation/firebase_analytics/latest/observer/FirebaseAnalyticsObserver-class.html).
