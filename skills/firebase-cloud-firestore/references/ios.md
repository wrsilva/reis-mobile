# Cloud Firestore — native iOS (Swift)

Use this reference instead of the Dart code in `SKILL.md` when the project is a native iOS app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Register the iOS app in the Firebase console and add `GoogleService-Info.plist` to the app target.
- Add `https://github.com/firebase/firebase-ios-sdk` with Swift Package Manager and link only the products you use (listed below), or the matching pods if the project already uses CocoaPods.
- Call `FirebaseApp.configure()` once at launch: in `application(_:didFinishLaunchingWithOptions:)`, or in a SwiftUI `App` through `@UIApplicationDelegateAdaptor`.
- Check the Firebase version in `Package.resolved` or `Podfile.lock`, and the minimum iOS version it requires, before writing code against newer APIs.

## Package product

`FirebaseFirestore` — `import FirebaseFirestore`

## Read and listen

```swift
private var listener: ListenerRegistration?

func observeOrders(uid: String) {
    listener = Firestore.firestore().collection("orders")
        .whereField("userId", isEqualTo: uid)
        .order(by: "createdAt", descending: true)
        .addSnapshotListener { snapshot, error in
            guard let documents = snapshot?.documents else { return }
            self.orders = documents.compactMap { try? $0.data(as: Order.self) }
        }
}

func stop() { listener?.remove() }
```

A forgotten listener keeps reading documents and billing reads; remove it when the screen or model goes away.

## Write

```swift
struct Order: Codable {
    @DocumentID var id: String?
    var userId: String
    var total: Int
    @ServerTimestamp var createdAt: Timestamp?
}

try Firestore.firestore().collection("orders").document(id).setData(from: order)
```

Use batches or `runTransaction` when several documents must change together. Do not silently drop documents that fail to decode in production code; log the error so schema drift is visible.

## Notes

- Offline persistence is on by default on iOS; design UI for pending writes.
- A query that needs a composite index fails with an error containing a link that creates it.
- Emulator: `Firestore.firestore().useEmulator(withHost: "localhost", port: 8080)` before any other Firestore call.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
