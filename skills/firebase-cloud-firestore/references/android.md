# Cloud Firestore — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

## Dependency

`implementation("com.google.firebase:firebase-firestore")`

## Read and listen

```kotlin
private val db = Firebase.firestore

fun observeOrders(uid: String): Flow<List<Order>> =
    db.collection("orders")
        .whereEqualTo("userId", uid)
        .orderBy("createdAt", Query.Direction.DESCENDING)
        .snapshots()                                   // Flow; the listener is removed when collection stops
        .map { snapshot -> snapshot.toObjects<Order>() }
```

With `addSnapshotListener`, keep the returned `ListenerRegistration` and call `remove()` when the screen or scope ends; a forgotten listener keeps reading documents and billing reads.

## Write

```kotlin
data class Order(val userId: String = "", val total: Long = 0, val createdAt: Timestamp? = null) // defaults: toObject needs a no-arg constructor

db.collection("orders").document(id).set(order).await()
db.runTransaction { tx -> /* read, then write */ }.await()
```

Use `FieldValue.serverTimestamp()` for timestamps instead of the device clock, and batches or transactions when several documents must change together.

## Notes

- Offline persistence is on by default on Android; writes resolve locally and sync later, so design UI for pending writes.
- A query that needs a composite index fails with `FAILED_PRECONDITION`; the error message contains a link that creates the index.
- Emulator: `db.useEmulator("10.0.2.2", 8080)` before any other Firestore call.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
