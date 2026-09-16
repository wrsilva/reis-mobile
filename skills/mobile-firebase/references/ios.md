# Firebase in native iOS apps

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

## Products

Each guide names the Swift package product to link.

| Product | Guide |
|---|---|
| Authentication | [ios/auth.md](ios/auth.md) |
| Cloud Firestore | [ios/firestore.md](ios/firestore.md) |
| Realtime Database | [ios/realtime-database.md](ios/realtime-database.md) |
| Cloud Storage | [ios/storage.md](ios/storage.md) |
| Cloud Functions (callable) | [ios/functions.md](ios/functions.md) |
| Cloud Messaging (push) | [ios/messaging.md](ios/messaging.md) |
| Analytics | [ios/analytics.md](ios/analytics.md) |
| Crashlytics | [ios/crashlytics.md](ios/crashlytics.md) |
| Remote Config | [ios/remote-config.md](ios/remote-config.md) |
| App Check | [ios/app-check.md](ios/app-check.md) |
| In-App Messaging | [ios/in-app-messaging.md](ios/in-app-messaging.md) |
| AI Logic | [ios/ai-logic.md](ios/ai-logic.md) |
| SQL Connect (formerly Data Connect) | [ios/sql-connect.md](ios/sql-connect.md) |
