# Firebase App Check — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Dependencies

- Production: `implementation("com.google.firebase:firebase-appcheck-playintegrity")`
- Debug builds only: `debugImplementation("com.google.firebase:firebase-appcheck-debug")`

## Install the provider before other Firebase calls

```kotlin
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        Firebase.initialize(this)
        Firebase.appCheck.installAppCheckProviderFactory(
            if (BuildConfig.DEBUG) DebugAppCheckProviderFactory.getInstance()
            else PlayIntegrityAppCheckProviderFactory.getInstance(),
        )
    }
}
```

The debug factory class only exists in the debug dependency; reference it from a debug-only source set, or through the build type, so release builds compile without it.

## Notes

- Play Integrity requires the app's Google Cloud project to be linked in the Play Console; sideloaded or unrecognized builds fail attestation.
- The debug provider prints a debug token in Logcat on first run; register it in the Firebase console and never commit it.
- Watch the App Check metrics for each product before turning on enforcement; enforcing too early blocks users on outdated app versions.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
