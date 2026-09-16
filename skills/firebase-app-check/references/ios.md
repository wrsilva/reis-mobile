# Firebase App Check — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

## Package product

`FirebaseAppCheck` — `import FirebaseAppCheck`

## Install the provider before `FirebaseApp.configure()`

```swift
final class AppCheckFactory: NSObject, AppCheckProviderFactory {
    func createProvider(with app: FirebaseApp) -> AppCheckProvider? {
        #if DEBUG
        return AppCheckDebugProvider(app: app)
        #else
        return AppAttestProvider(app: app)
        #endif
    }
}

// launch, before FirebaseApp.configure()
AppCheck.setAppCheckProviderFactory(AppCheckFactory())
FirebaseApp.configure()
```

## Notes

- App Attest needs the App Attest capability; its entitlement environment must be `production` for App Store and TestFlight builds. Devices or OS versions without App Attest can fall back to DeviceCheck (`DeviceCheckProvider`).
- The debug provider logs a debug token on first run (simulator or debug builds); register it in the Firebase console and never commit it.
- Watch the App Check metrics before turning on enforcement; enforcing too early blocks users on outdated app versions.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
