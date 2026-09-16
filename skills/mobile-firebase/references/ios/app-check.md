# Firebase App Check — native iOS (Swift)

Project setup shared by every Firebase product is in [../ios.md](../ios.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
