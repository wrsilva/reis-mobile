# Cloud Firestore — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
