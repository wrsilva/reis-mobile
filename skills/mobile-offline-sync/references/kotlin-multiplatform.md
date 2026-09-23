# Offline sync in Kotlin Multiplatform

Offline sync is the strongest case for KMP: the store schema, the outbox, the ordering rules, the backoff, the idempotency keys and the conflict strategy are pure logic that must behave **identically** on both platforms, and a divergence between an Android and an iOS implementation of the same queue produces data bugs that are almost impossible to reproduce. Put all of it in `commonMain`, and leave only scheduling and connectivity to the targets.

## The boundary

| Layer | Source set | Why |
|---|---|---|
| Store schema, DAOs, outbox table, drain algorithm, collapsing, backoff, conflict resolution | `commonMain` | One implementation, one test suite, no divergence |
| HTTP client and serialization | `commonMain` (Ktor + kotlinx.serialization) | Same headers, same retry classification on both targets |
| Connectivity observation | `expect`/`actual` or injected interface | `ConnectivityManager` vs `NWPathMonitor` |
| Scheduling the drain | The host apps | `WorkManager` in `androidMain`/the Android app, `BGTaskScheduler` in the iOS app |
| A secure place for credentials | `expect`/`actual` | Keystore vs Keychain — see [mobile-security](../../mobile-security/SKILL.md) |

Prefer an injected interface over `expect`/`actual` for connectivity: it is easier to fake in `commonTest`, and it keeps the shared code free of platform conditionals.

## The store and the outbox

**SQLDelight** is the common choice: one `.sq` schema, generated typed queries, and `asFlow()` reactive reads on both targets.

```sql
-- outbox.sq
CREATE TABLE outbox (
  id              TEXT NOT NULL PRIMARY KEY,   -- operation UUID = idempotency key
  entityType      TEXT NOT NULL,
  entityId        TEXT NOT NULL,
  operation       TEXT NOT NULL,
  payload         TEXT NOT NULL,               -- changed fields only
  attempts        INTEGER NOT NULL DEFAULT 0,
  nextAttemptAt   INTEGER NOT NULL,
  lastError       TEXT,
  createdAt       INTEGER NOT NULL
);

dueInOrder:
SELECT * FROM outbox WHERE nextAttemptAt <= :now ORDER BY createdAt ASC;
```

Drivers differ per target (`AndroidSqliteDriver`, `NativeSqliteDriver`, and an in-memory JDBC driver for JVM tests) but the queries and the transaction semantics do not. Room's KMP support is an alternative; check the version's target coverage before choosing it.

Write the optimistic change and the outbox insert in one `transaction { }`.

## The drain in commonMain

```kotlin
class SyncEngine(
    private val outbox: OutboxDao,
    private val api: SyncApi,
    private val clock: Clock,                     // injected: never Clock.System inside the logic
    private val scope: CoroutineScope,
) {
    private val mutex = Mutex()

    suspend fun drain() = mutex.withLock {          // single-flight across reconnect bursts
        for (entry in outbox.dueInOrder(clock.now())) {
            when (val result = api.send(entry, idempotencyKey = entry.id)) {
                is Sent      -> outbox.confirm(entry)                    // delete + mark synced, one transaction
                is Permanent -> outbox.deadLetter(entry, result.reason)  // never blocks the queue
                is Conflict  -> resolve(entry, result.serverVersion)
                is Transient -> {
                    outbox.scheduleRetry(entry, backoff(entry.attempts + 1))
                    if (result.isOffline) break
                }
            }
        }
    }
}
```

A `Mutex` is the right primitive here: the current Kotlin/Native memory manager allows shared mutable state across threads, so the same engine instance works on both targets without freezing rules.

Do not read the clock inside the logic. Inject `Clock` so backoff and expiry are deterministic in `commonTest`, and because a device clock that is hours off must never decide ordering.

## Ktor

```kotlin
HttpClient {
    install(ContentNegotiation) { json() }
    install(HttpRequestRetry) {
        retryOnServerErrors(maxRetries = 2)
        exponentialDelay()                        // in-session only; the durable schedule is the outbox
    }
    install(HttpTimeout) { requestTimeoutMillis = 30_000 }
}
```

`HttpRequestRetry` covers a blip inside one drain. It does not survive process death, so the outbox's `nextAttemptAt` remains the real retry schedule. Send `Idempotency-Key` from the entry id on every mutating request and `If-Match` with the stored version on updates; classify `412` as `Conflict`, other 4xx as `Permanent`, 5xx/408/429 and IO failures as `Transient`.

## Scheduling from the hosts

Both hosts call the same shared `drain()`:

- **Android:** a `CoroutineWorker` enqueued as unique work with a `CONNECTED` constraint and `BackoffPolicy.EXPONENTIAL`; return `Result.retry()` for transient outcomes. See [android.md](android.md).
- **iOS:** `BGAppRefreshTaskRequest` / `BGProcessingTaskRequest` plus a drain on scene activation; always schedule the next request and call `setTaskCompleted(success:)`. See [ios.md](ios.md).
- The suspend function is exposed to Swift as a completion-handler function; cancel it from the task's `expirationHandler` so an expired background task does not leave a half-drained queue holding the mutex.

Platform limits are unchanged by KMP — [background.md](../../mobile-performance/references/background.md) applies in full.

## Testing

This is where the shared design pays for itself: every case in the skill's §9 is a `commonTest` against an in-memory driver and a fake `SyncApi`, and it runs on the JVM *and* on the Kotlin/Native iOS test binary, which is the only way to prove the two targets behave the same.

- Fake `SyncApi` returning: success, success-after-the-response-was-lost, `Conflict` with a newer server version, `Permanent`, and `Transient`.
- Injected `Clock` and `kotlinx-coroutines-test` for backoff timing.
- Process-death is a host-level test; the shared part is covered by "reopen the database and drain again".
- Run `commonTest` on both targets in CI. A test suite that only runs on JVM leaves the Kotlin/Native behaviour unverified, which defeats the reason for sharing the code.

## Official documentation

- Kotlin Multiplatform: https://kotlinlang.org/docs/multiplatform.html
- SQLDelight: https://sqldelight.github.io/sqldelight/
- Ktor client retry and timeouts: https://ktor.io/docs/client-retry.html
- kotlinx.serialization: https://kotlinlang.org/docs/serialization.html
- Kotlin/Native memory management: https://kotlinlang.org/docs/native-memory-manager.html
