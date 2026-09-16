# Cloud Storage for Firebase — native Android (Kotlin)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native Android app or the Android side of a Kotlin Multiplatform app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the Android app in the Firebase console and put `google-services.json` in the app module (`app/`). Apply the Google services Gradle plugin (`com.google.gms.google-services`) there.
- Declare Firebase through the Firebase Android BoM — `implementation(platform("com.google.firebase:firebase-bom:<version>"))` — and omit versions on Firebase artifacts. Reuse the BoM version already in the version catalog or build files; check the current one in the Firebase release notes before adding it.
- Use the main modules, not `-ktx` artifacts. The Kotlin extensions moved into the main modules in BoM 32.5.0, and the KTX modules were removed from the BoM in 34.0.0. Imports look like `com.google.firebase.Firebase` and `com.google.firebase.<product>.<product>`.
- Firebase initializes from `google-services.json` automatically; call `FirebaseApp.initializeApp` only for manual or multiple-app setups.
- `.await()` on Firebase `Task`s comes from `org.jetbrains.kotlinx:kotlinx-coroutines-play-services`.
- The Android emulator reaches the Firebase Local Emulator Suite on the host at `10.0.2.2`, not `localhost`.

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
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
