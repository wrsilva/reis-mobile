# Firebase Realtime Database — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

## Dependency

`implementation("com.google.firebase:firebase-database")`

## Setup notes

- Enable disk persistence, if the app needs it, before any other Database call: `Firebase.database.setPersistenceEnabled(true)` in `Application.onCreate`. Calling it later throws.
- A database outside the default region is addressed by URL: `Firebase.database("https://<db>.<region>.firebasedatabase.app")`.

## Read and listen

```kotlin
private val ref = Firebase.database.reference.child("rooms").child(roomId).child("messages")

private val listener = object : ValueEventListener {
    override fun onDataChange(snapshot: DataSnapshot) {
        messages = snapshot.children.mapNotNull { it.getValue<Message>() }
    }
    override fun onCancelled(error: DatabaseError) { /* permission denied or network */ }
}

fun start() = ref.limitToLast(50).addValueEventListener(listener)
fun stop() = ref.removeEventListener(listener)
```

Listen to the narrowest path that the screen needs and limit queries; a listener on a parent node downloads every child.

## Write

```kotlin
data class Message(val text: String = "", val author: String = "", val sentAt: Long = 0) // defaults for getValue

ref.push().setValue(message).await()
ref.child(id).updateChildren(mapOf("text" to edited)).await()
```

Use `ServerValue.TIMESTAMP` for server time, and transactions for counters.

## Emulator

`Firebase.database.useEmulator("10.0.2.2", 9000)` before any other Database call.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
