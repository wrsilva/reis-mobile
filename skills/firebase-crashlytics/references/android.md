# Firebase Crashlytics — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

## Dependencies and plugin

- App module: apply the `com.google.firebase.crashlytics` Gradle plugin and add `implementation("com.google.firebase:firebase-crashlytics")`.
- Native (C/C++) crashes: add `firebase-crashlytics-ndk` instead.
- With the plugin applied, R8 mapping files for release builds are uploaded so stack traces are deobfuscated. If traces show obfuscated names, check that the build type did not disable mapping upload.

## Usage

```kotlin
private val crashlytics = Firebase.crashlytics

crashlytics.setUserId(opaqueUserId)                 // an internal id, never an email
crashlytics.setCustomKeys { key("screen", "checkout"); key("cart_items", count) }
crashlytics.log("payment started")
crashlytics.recordException(error)                  // non-fatal
```

## Notes

- Opt-in collection: set `firebase_crashlytics_collection_enabled` to `false` in the manifest and call `setCrashlyticsCollectionEnabled(true)` after consent.
- Keep debug builds out of production reports (disable collection for the debug build type).
- To test, throw an unhandled exception, then relaunch the app: reports are sent on the next launch.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
