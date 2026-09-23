# Offline sync on native Android

Android ships every piece this needs: Room for the store and the outbox, WorkManager for a drain that survives process death and reboot, and `ConnectivityManager` for the trigger. The mistakes are almost always in how they are combined, not in the APIs themselves.

## The store and the outbox

Room, with the sync state on the entity and a separate outbox table:

```kotlin
@Entity(tableName = "orders")
data class OrderEntity(
    @PrimaryKey val id: String,            // client-generated UUID
    val total: Long,
    val syncStatus: SyncStatus,            // SYNCED, PENDING, FAILED
    val serverVersion: String?,            // ETag or version from the last successful fetch
    val updatedAt: Long,
)

@Entity(tableName = "outbox")
data class OutboxEntry(
    @PrimaryKey val id: String,            // operation UUID = idempotency key
    val entityType: String,
    val entityId: String,
    val operation: String,                 // CREATE | UPDATE | DELETE
    val payloadJson: String,               // changed fields only
    val attempts: Int = 0,
    val nextAttemptAt: Long,
    val lastError: String? = null,
    val createdAt: Long,
)
```

Write the optimistic change and the outbox entry inside one `@Transaction` DAO method. Expose reads as `Flow<List<OrderEntity>>` so the UI updates when either the optimistic write or the sync lands.

For paged data backed by a server, Paging 3's `RemoteMediator` is the supported pattern: the `PagingSource` reads Room, the mediator fills Room from the network, and the UI never sees a network state machine.

## The drain

`WorkManager`, as **unique** work, with backoff delegated to the platform:

```kotlin
val request = OneTimeWorkRequestBuilder<SyncWorker>()
    .setConstraints(Constraints(requiredNetworkType = NetworkType.CONNECTED))
    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
    .build()

WorkManager.getInstance(context).enqueueUniqueWork(
    "sync-outbox",
    ExistingWorkPolicy.KEEP,     // a burst of reconnect events must not queue five drains
    request,
)
```

Inside the worker:

- Process entries **in order per entity**; parallelize only across unrelated entities.
- Return `Result.retry()` for transient failures — WorkManager applies the backoff policy and re-runs after process death or reboot. Returning `Result.failure()` discards the work.
- Handle a permanently rejected entry by dead-lettering it in the database and **continuing**, not by failing the whole worker.
- Enqueue the drain with `ExistingWorkPolicy.KEEP` (or `APPEND_OR_REPLACE` when ordering across enqueues matters) so reconnect bursts do not start concurrent drains.
- `setExpedited` only when the user is waiting; an ordinary background drain does not qualify and the quota is limited.

Constraints and foreground-service rules are in [background.md](../../mobile-performance/references/background.md). A periodic sync has a 15-minute floor and is never exact.

## Idempotency over Retrofit/OkHttp

Put the entry's id on the request as the idempotency key, and make sure **OkHttp's own retries do not hide a failure you need to record**:

```kotlin
@POST("orders")
suspend fun createOrder(
    @Header("Idempotency-Key") key: String,
    @Body body: OrderPayload,
): Response<OrderDto>
```

`retryOnConnectionFailure` (on by default) retries connection-level failures transparently. That is safe *only* because the key makes the call idempotent; without server-side key handling it is a duplicate-creation mechanism. An `Interceptor` that retries on 5xx compounds the problem — keep retry scheduling in WorkManager, where it survives the process, rather than in an interceptor, where it does not.

## Conflict detection

Send the version you based the edit on and let the server reject:

```kotlin
@PUT("orders/{id}")
suspend fun updateOrder(
    @Path("id") id: String,
    @Header("If-Match") version: String,
    @Header("Idempotency-Key") key: String,
    @Body body: Map<String, Any?>,       // changed fields only
): Response<OrderDto>
```

A `412 Precondition Failed` is the conflict signal; apply the strategy chosen per entity in the skill's §6. If the API has no ETag or version field, record it as a finding — conflicts are undetectable and the design is last-write-wins by accident.

## Connectivity as a trigger

```kotlin
connectivityManager.registerNetworkCallback(
    NetworkRequest.Builder()
        .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        .addCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)   // not just "an interface"
        .build(),
    callback,
)
```

`NET_CAPABILITY_VALIDATED` excludes most captive portals, which a plain `NET_CAPABILITY_INTERNET` check does not. Even so, treat it as a hint: enqueue the WorkManager request and let its `NetworkType.CONNECTED` constraint be the real gate. Also drain on `ON_START` of the process lifecycle and on explicit user refresh.

## Testing

- **Room** has an in-memory builder (`Room.inMemoryDatabaseBuilder`), so ordering, collapsing, dead-lettering and transaction atomicity are JVM unit tests.
- **WorkManager** ships `androidx.work:work-testing`: `WorkManagerTestInitHelper` with a `SynchronousExecutor` plus `TestDriver.setAllConstraintsMet`/`setInitialDelayMet` makes the drain deterministic, including the retry path.
- **The API** should be faked at the repository boundary, or served by MockWebServer when you need real HTTP semantics — MockWebServer can return a 200 the client never receives (`SocketPolicy.DISCONNECT_AFTER_REQUEST`), which is exactly the lost-response case.
- **Device conditions:** the emulator's cellular/network delay and speed settings, `adb shell svc wifi disable` / `svc data disable`, and `adb shell cmd connectivity airplane-mode enable` for a scripted offline window.
- Process death: `adb shell am kill <package>` mid-drain, then relaunch and assert exactly one server-side record.

## Official documentation

- Offline-first app architecture: https://developer.android.com/topic/architecture/data-layer/offline-first
- Room: https://developer.android.com/training/data-storage/room
- WorkManager: https://developer.android.com/topic/libraries/architecture/workmanager
- Testing WorkManager: https://developer.android.com/topic/libraries/architecture/workmanager/how-to/integration-testing
- Monitoring connectivity status: https://developer.android.com/training/monitoring-device-state/connectivity-status-type
- Paging with a network and database: https://developer.android.com/topic/libraries/architecture/paging/v3-network-db
