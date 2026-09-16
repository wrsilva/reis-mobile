# Cloud Storage for Firebase — native iOS (Swift)

Project setup shared by every Firebase product is in [../ios.md](../ios.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Package product

`FirebaseStorage` — `import FirebaseStorage`

## Upload

```swift
func uploadAvatar(uid: String, data: Data) async throws -> URL {
    let ref = Storage.storage().reference().child("users/\(uid)/avatar.jpg")
    let metadata = StorageMetadata()
    metadata.contentType = "image/jpeg"
    _ = try await ref.putDataAsync(data, metadata: metadata)
    return try await ref.downloadURL()
}
```

- Compress and resize images before uploading; use `putFile(from:)` for large files instead of loading them into `Data`.
- For progress, keep the `StorageUploadTask` returned by `putFile`/`putData` and observe `.progress`; remove observers when done.
- Put user files under a path with the user id and enforce it in Storage security rules.

## Download

Prefer loading the download URL with an image loader that caches and downsamples. `getData(maxSize:)` loads the whole file in memory; use `write(toFile:)` for large files.

## Emulator

`Storage.storage().useEmulator(withHost: "localhost", port: 9199)` before any other Storage call.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
