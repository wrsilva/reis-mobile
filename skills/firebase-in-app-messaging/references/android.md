# Firebase In-App Messaging — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

## Dependencies

`implementation("com.google.firebase:firebase-inappmessaging-display")`, plus `firebase-analytics`: campaigns are triggered by Analytics events.

## Usage

```kotlin
private val inAppMessaging = Firebase.inAppMessaging

inAppMessaging.setMessagesSuppressed(true)    // during onboarding, checkout or other flows that must not be interrupted
inAppMessaging.setMessagesSuppressed(false)
inAppMessaging.triggerEvent("checkout_completed")   // trigger a campaign without logging an Analytics event
```

## Notes

- Messages display on the next foreground after they are fetched, not immediately after publishing a campaign.
- To preview a campaign on a device, use **Test on device** in the console with the app instance's Firebase Installation ID (`Firebase.installations.id`).
- A custom look requires implementing `FirebaseInAppMessagingDisplay` and registering it.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
