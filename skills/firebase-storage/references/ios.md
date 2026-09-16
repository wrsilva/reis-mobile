# Cloud Storage for Firebase — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

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
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
