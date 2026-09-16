# Cloud Functions for Firebase (callable functions) — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
