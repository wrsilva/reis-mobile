# Firebase Crashlytics — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
