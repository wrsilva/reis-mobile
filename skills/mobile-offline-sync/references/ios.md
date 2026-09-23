# Offline sync on native iOS

iOS gives you two very different routes: **let the system sync for you** with Core Data + CloudKit, or **own the sync** with a local store, an outbox and `URLSession`. Choosing the first when the backend is not CloudKit, or hand-rolling the second when CloudKit would have done, is the most expensive mistake in this area.

## Choose the route first

| Route | Fits when |
|---|---|
| `NSPersistentCloudKitContainer` (Core Data + CloudKit) | Apple-only product, per-user private data, no custom backend. Apple handles transport, retries, merge policy and multi-device |
| SwiftData with CloudKit | Same, on a newer API surface; check the deployment target and the feature gaps against Core Data before committing |
| Local store + your own outbox | There is a REST/GraphQL backend, or Android/web clients share the data. This is the rest of this document |
| A sync SDK (Firestore, Realm/Atlas Device Sync, PowerSync…) | The backend is that product; offline behaviour comes with it — read its conflict rules rather than inventing your own |

## The local store

- **Core Data** or **SwiftData** for object graphs with relationships and change notification. Enable `NSPersistentHistoryTrackingKey` when a background context or an extension writes, so the UI context can merge remote-ish changes correctly.
- **GRDB** or raw SQLite when you want SQL, explicit migrations and value types; `ValueObservation` gives reactive reads.
- `UserDefaults` is for settings. It is not a store for syncable records, and it is not transactional.

Keep sync state on the record: `syncStatus`, `serverVersion` (ETag), `updatedAt`, `lastError`.

## The outbox

A table/entity, written **in the same context save** as the optimistic change:

```swift
struct OutboxEntry: Codable, Identifiable {
    let id: UUID                  // operation id = idempotency key
    let entityType: String
    let entityID: String
    let operation: Operation      // create / update / delete
    let payload: Data             // changed fields only
    var attempts: Int
    var nextAttemptAt: Date
    var lastError: String?
    let createdAt: Date
}
```

In Core Data, perform the optimistic write and the outbox insert on one background context and save once. Two saves mean a crash can leave one without the other.

Use an actor for the drain so concurrent triggers cannot interleave:

```swift
actor SyncEngine {
    private var isDraining = false

    func drain() async {
        guard !isDraining else { return }
        isDraining = true
        defer { isDraining = false }

        for entry in await outbox.dueEntriesInOrder() {
            do {
                try await api.send(entry, idempotencyKey: entry.id.uuidString)
                try await store.confirm(entry)          // delete entry + mark record synced, one save
            } catch let error as APIError where error.isPermanent {
                try? await outbox.deadLetter(entry, reason: error.message)
            } catch {
                try? await outbox.scheduleRetry(entry, after: backoff(entry.attempts + 1))
                if error.isOffline { break }
            }
        }
    }
}
```

## URLSession

- **`waitsForConnectivity`** on the session configuration makes a request wait for connectivity instead of failing immediately — useful for a user-initiated send, but it does not replace the outbox: the app can still be terminated while waiting.
- **A background configuration** (`URLSessionConfiguration.background(withIdentifier:)`) hands the transfer to the system, which continues it while the app is suspended and relaunches the app to deliver completion. Use it for uploads and downloads of files; it is not suited to a chatty JSON queue, and the completion handler must work with no UI state in memory.
- Set `Idempotency-Key` from the entry id on every mutating request, and `If-Match` with the stored ETag on updates. A `412` is the conflict signal.
- `URLSession` does not retry application-level failures. Schedule retries from the outbox, not by recursing in the completion handler.

## Triggers

- **Foreground:** `scenePhase` becoming `.active`, or `UIApplication.didBecomeActiveNotification`.
- **Connectivity:** `NWPathMonitor` (Network framework). `path.status == .satisfied` means a usable interface, not a reachable server — use it as a hint and let the request be the proof. Check `path.isExpensive` and `path.isConstrained` before draining a large queue on cellular or Low Data Mode.
- **Background:** `BGAppRefreshTaskRequest` for short opportunistic drains, `BGProcessingTaskRequest` for a large one while charging, and a background `URLSession` for transfers that must complete. There is no guaranteed schedule — see [background.md](../../mobile-performance/references/background.md). Always schedule the next request at the end of a run, set the `expirationHandler`, and call `setTaskCompleted(success:)`.
- **Never** a `Timer` that polls.

## Conflict resolution

With your own backend: store the ETag, send `If-Match`, apply the per-entity strategy from the skill's §6 on `412`.

With Core Data and CloudKit, the merge policy *is* the strategy, and it is not always the one you want: `NSMergeByPropertyObjectTrumpMergePolicy` keeps local values per property, `...StoreTrumpMergePolicy` keeps the persisted ones, and `NSOverwriteMergePolicy`/`NSRollbackMergePolicy` are whole-object. Choose it explicitly on each context rather than inheriting `NSErrorMergePolicy` and discovering conflicts as save failures in production.

## Testing

- Put the network behind a protocol and inject a fake in tests; `URLProtocol` subclassing works when you need the real `URLSession` path, including a response that arrives after the server committed.
- Core Data with an in-memory store (`NSInMemoryStoreType`, or `/dev/null` for a SQLite store) makes outbox ordering, collapsing and transaction atomicity fast unit tests. SwiftData takes an in-memory `ModelConfiguration`.
- Inject a clock rather than reading `Date()` in backoff and expiry logic, so timing is deterministic.
- Device conditions: the **Network Link Conditioner** (Settings → Developer on device, or the Additional Tools package on the Mac) for loss and latency profiles, and Xcode's simulated network conditions in the debug gauges.
- Background task runs can be triggered from the debugger with the documented LLDB call to `_simulateLaunchForTaskWithIdentifier:` — the only practical way to test a `BGTask` path without waiting for the system.

## Official documentation

- Core Data: https://developer.apple.com/documentation/coredata
- Mirroring a Core Data store with CloudKit: https://developer.apple.com/documentation/coredata/mirroring_a_core_data_store_with_cloudkit
- SwiftData: https://developer.apple.com/documentation/swiftdata
- NWPathMonitor: https://developer.apple.com/documentation/network/nwpathmonitor
- Downloading files in the background: https://developer.apple.com/documentation/foundation/url_loading_system/downloading_files_in_the_background
- Background tasks: https://developer.apple.com/documentation/backgroundtasks
