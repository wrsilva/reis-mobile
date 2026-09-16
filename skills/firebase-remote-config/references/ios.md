# Firebase Remote Config — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

## Package product

`FirebaseRemoteConfig` — `import FirebaseRemoteConfig`

## Setup and fetch

```swift
let remoteConfig = RemoteConfig.remoteConfig()

func initRemoteConfig() async throws {
    let settings = RemoteConfigSettings()
    #if DEBUG
    settings.minimumFetchInterval = 0
    #endif
    remoteConfig.configSettings = settings
    remoteConfig.setDefaults(fromPlist: "RemoteConfigDefaults")
    try await remoteConfig.fetchAndActivate()
}

var showNewCheckout: Bool { remoteConfig.configValue(forKey: "show_new_checkout").boolValue }
```

- Ship in-app defaults for every key, so the app works offline and before the first fetch.
- Do not block launch on the fetch; the default minimum fetch interval is 12 hours, and lower intervals in production get throttled.

## Real-time updates

```swift
listenerRegistration = remoteConfig.addOnConfigUpdateListener { update, error in
    guard error == nil else { return }
    remoteConfig.activate()
}
```

Keep the registration and call `remove()` when no longer needed.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
