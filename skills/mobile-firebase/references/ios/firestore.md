# Cloud Firestore — native iOS (Swift)

Project setup shared by every Firebase product is in [../ios.md](../ios.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
