# Firebase Cloud Messaging — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

## Package product

`FirebaseMessaging` — `import FirebaseMessaging`

## Project setup

- Enable the **Push Notifications** capability, and **Background Modes → Remote notifications** for data-only (silent) messages.
- Upload an APNs authentication key in the Firebase console (Project settings → Cloud Messaging).

## Registration

```swift
final class AppDelegate: NSObject, UIApplicationDelegate, MessagingDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        FirebaseApp.configure()
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self
        application.registerForRemoteNotifications()
        return true
    }

    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        // send the token to your backend, associated with the signed-in user
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .sound]   // otherwise notifications are not shown while the app is in the foreground
    }
}
```

- Ask for permission with `UNUserNotificationCenter.current().requestAuthorization(options:)` at a moment the user understands why.
- Firebase swizzles the app delegate to pass the APNs token. If `FirebaseAppDelegateProxyEnabled` is `NO` in `Info.plist`, set `Messaging.messaging().apnsToken = deviceToken` in `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)`.
- The FCM token depends on the APNs token; calling `Messaging.messaging().token()` before APNs registration completes fails.
- Rich notifications with images need a Notification Service Extension.
- Test on a real device; simulator support for remote notifications is limited.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
