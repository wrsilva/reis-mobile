# Firebase Realtime Database — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
