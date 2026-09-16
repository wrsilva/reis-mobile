# Firebase in native Android apps

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

## Products

The guides use the current main-module APIs (`Firebase.auth`, `Firebase.firestore`...).

| Product | Guide |
|---|---|
| Authentication | [android/auth.md](android/auth.md) |
| Cloud Firestore | [android/firestore.md](android/firestore.md) |
| Realtime Database | [android/realtime-database.md](android/realtime-database.md) |
| Cloud Storage | [android/storage.md](android/storage.md) |
| Cloud Functions (callable) | [android/functions.md](android/functions.md) |
| Cloud Messaging (push) | [android/messaging.md](android/messaging.md) |
| Analytics | [android/analytics.md](android/analytics.md) |
| Crashlytics | [android/crashlytics.md](android/crashlytics.md) |
| Remote Config | [android/remote-config.md](android/remote-config.md) |
| App Check | [android/app-check.md](android/app-check.md) |
| In-App Messaging | [android/in-app-messaging.md](android/in-app-messaging.md) |
| AI Logic | [android/ai-logic.md](android/ai-logic.md) |
| SQL Connect (formerly Data Connect) | [android/sql-connect.md](android/sql-connect.md) |
