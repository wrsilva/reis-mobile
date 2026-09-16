# Firebase Remote Config — native iOS (Swift)

Project setup shared by every Firebase product is in [../ios.md](../ios.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
