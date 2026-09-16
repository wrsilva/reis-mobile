# Firebase Realtime Database — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

## Package product

`FirebaseDatabase` — `import FirebaseDatabase`

## Setup notes

- Enable disk persistence, if the app needs it, before creating any reference: `Database.database().isPersistenceEnabled = true`.
- A database outside the default region is addressed by URL: `Database.database(url: "https://<db>.<region>.firebasedatabase.app")`.

## Read and listen

```swift
private let ref = Database.database().reference().child("rooms").child(roomId).child("messages")
private var handle: DatabaseHandle?

func start() {
    handle = ref.queryLimited(toLast: 50).observe(.value) { snapshot in
        self.messages = snapshot.children.compactMap { ($0 as? DataSnapshot).flatMap { try? $0.data(as: Message.self) } }
    }
}

func stop() {
    if let handle { ref.removeObserver(withHandle: handle) }
}
```

Listen to the narrowest path the screen needs; an observer on a parent node downloads every child.

## Write

```swift
try ref.childByAutoId().setValue(from: message)
try await ref.child(id).updateChildValues(["text": edited])
```

Use `ServerValue.timestamp()` for server time, and `runTransactionBlock` for counters.

## Emulator

`Database.database().useEmulator(withHost: "localhost", port: 9000)` before any other Database call.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
