# Google Analytics for Firebase — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

## Dependency

`implementation("com.google.firebase:firebase-analytics")`

## Events

```kotlin
private val analytics = Firebase.analytics

analytics.logEvent(FirebaseAnalytics.Event.SELECT_ITEM) {
    param(FirebaseAnalytics.Param.ITEM_ID, item.id)
    param(FirebaseAnalytics.Param.ITEM_NAME, item.name)
}
```

- Prefer the recommended events and parameters (`FirebaseAnalytics.Event.*`, `FirebaseAnalytics.Param.*`) before inventing custom ones; reports use them.
- Custom event and parameter names: letters, digits and underscores, starting with a letter; check the current length and count limits in the documentation before designing a schema.
- Never log personal data (emails, names, phone numbers) as parameters or user properties.
- Screen views are collected automatically for Activities. For Compose navigation or single-Activity apps, log `FirebaseAnalytics.Event.SCREEN_VIEW` with `SCREEN_NAME` from the navigation callback.

## Consent and debugging

- Consent: `analytics.setConsent { analyticsStorage(FirebaseAnalytics.ConsentStatus.GRANTED) }` after the user decides; default consent can be set in the manifest.
- DebugView: `adb shell setprop debug.firebase.analytics.app <application-id>`, then `adb shell setprop debug.firebase.analytics.app .none.` to disable.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
