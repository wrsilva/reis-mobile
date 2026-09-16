# Cloud Storage for Firebase — native Android (Kotlin)

Project setup shared by every Firebase product is in [../android.md](../android.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Dependency

`implementation("com.google.firebase:firebase-storage")`

## Upload

```kotlin
private val storage = Firebase.storage

suspend fun uploadAvatar(uid: String, uri: Uri): Uri {
    val ref = storage.reference.child("users/$uid/avatar.jpg")
    val metadata = storageMetadata { contentType = "image/jpeg" }
    ref.putFile(uri, metadata)
        .addOnProgressListener { task -> progress = task.bytesTransferred.toFloat() / task.totalByteCount }
        .await()
    return ref.downloadUrl.await()
}
```

- Compress and resize images before uploading; camera photos are several megabytes.
- Long uploads should survive the screen going away: start them from a `ViewModel` scope or `WorkManager`, not from an Activity callback.
- Put user files under a path with the user id and enforce it in Storage security rules.

## Download

Prefer loading the download URL with the app's image library, which caches and downsamples. `ref.getBytes(maxBytes)` loads the whole file in memory; use `getFile` for large files.

## Emulator

`storage.useEmulator("10.0.2.2", 9199)` before any other Storage call.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
