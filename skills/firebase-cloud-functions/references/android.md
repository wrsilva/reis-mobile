# Cloud Functions for Firebase (callable functions) — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

## Dependency

`implementation("com.google.firebase:firebase-functions")`

## Call a function

```kotlin
private val functions = Firebase.functions("europe-west1")   // must match the region the function is deployed to

suspend fun addMessage(text: String): String {
    val result = functions.getHttpsCallable("addMessage").call(mapOf("text" to text)).await()
    @Suppress("UNCHECKED_CAST")
    return (result.getData() as Map<String, Any?>)["id"] as String
}
```

- A region mismatch fails as `NOT_FOUND`; `Firebase.functions` without a region targets `us-central1`.
- Handle `FirebaseFunctionsException`: `code` (`UNAUTHENTICATED`, `PERMISSION_DENIED`, `INVALID_ARGUMENT`...) and `details` from the function's `HttpsError`.
- The signed-in user's ID token and the App Check token are sent automatically; authorize in the function, never only in the app.
- Callables have a default timeout; raise it with `getHttpsCallable(name, options)` or on the callable only when the function really needs it.

## Emulator

`functions.useEmulator("10.0.2.2", 5001)` before calling.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
