# Firebase App Check — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

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
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
