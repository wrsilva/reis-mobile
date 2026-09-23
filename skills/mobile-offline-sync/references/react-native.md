# Offline sync in React Native and Expo

The JavaScript runtime is the weakest link here: it is torn down when the app is killed, and it gets little or no background time. So the durable part of the design — the store and the outbox — must be on disk, and the drain must be able to start from nothing on the next launch. An in-memory queue in a Redux store, or a promise chain waiting for the network, does not survive the swipe-up that ends the process.

## The store

| Option | Fits when |
|---|---|
| `expo-sqlite` or `op-sqlite` | You want SQL and full control; the usual base for a real outbox |
| `WatermelonDB` | Large local datasets with a defined sync protocol (pull/push with a `last_pulled_at` checkpoint) |
| `RxDB`, `PowerSync`, Legend-State, Firestore, Realm | The sync engine comes with the product — read its conflict rules instead of writing your own |
| `react-native-mmkv` / `AsyncStorage` | Settings and small caches. Not a store for syncable records |

TanStack Query is a cache, not a store: `persistQueryClient` plus `onlineManager` and paused mutations give you read-offline and replay-on-reconnect, which is enough for the "read cache" and simple "queued writes" levels in the skill's §2. It is not enough when the queue must survive process death with guaranteed ordering and per-entity collapsing — that needs rows in SQLite.

## The outbox in SQLite

```sql
CREATE TABLE IF NOT EXISTS outbox (
  id             TEXT PRIMARY KEY,    -- client UUID = idempotency key
  entity_type    TEXT NOT NULL,
  entity_id      TEXT NOT NULL,
  operation      TEXT NOT NULL,       -- create | update | delete
  payload        TEXT NOT NULL,       -- JSON of changed fields only
  attempts       INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  last_error     TEXT,
  created_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS outbox_ready ON outbox (next_attempt_at, created_at);
```

Insert the outbox row and apply the optimistic local change in one SQLite transaction. Generate the id with a UUID implementation that works in Hermes — `crypto.randomUUID` is not guaranteed in every runtime version, so `expo-crypto`, `react-native-uuid` or `react-native-get-random-values` + `uuid` is the safe route. Do not use `Math.random()` for an idempotency key.

## Draining

```ts
let draining = false;

export async function drain(): Promise<void> {
  if (draining) return;                 // NetInfo fires in bursts on reconnect
  draining = true;
  try {
    for (const entry of await dueEntriesInOrder()) {
      try {
        await api.send(entry, { idempotencyKey: entry.id });
        await db.withTransactionAsync(async () => {
          await deleteEntry(entry.id);
          await markSynced(entry.entity_id);
        });
      } catch (error) {
        if (isPermanent(error)) await deadLetter(entry.id, String(error));
        else {
          await scheduleRetry(entry.id, backoff(entry.attempts + 1));
          if (isOffline(error)) break;
        }
      }
    }
  } finally {
    draining = false;
  }
}
```

Triggers: `AppState` returning to `'active'`, a `NetInfo` event, an explicit pull-to-refresh, and a background task where one is available. Not `setInterval` — a JS timer does not run when the app is backgrounded, and when it does run it is the polling pattern the platform penalizes.

## Connectivity

`@react-native-community/netinfo` exposes `isConnected` (an interface is up) and `isInternetReachable` (a reachability probe, which may be `null` while unknown). Only the second approximates "the server can be reached", and neither is proof — a successful API call is. Use the event as a hint to call `drain()`.

With TanStack Query, wire NetInfo into `onlineManager` so queries and mutations pause and resume with connectivity instead of failing:

```ts
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
);
```

## Background

JavaScript gets very little background time, and the rules are the platform's, not React Native's — see [background.md](../../mobile-performance/references/background.md).

- **Expo:** `expo-task-manager` with the SDK's background task/fetch module. The module name and API have changed across SDK versions; check the docs for the pinned SDK rather than copying an older snippet.
- **Bare React Native:** Headless JS on Android (started from a native service or a data push), and a community bridge to `BGTaskScheduler` on iOS.
- Whatever runs in the background must boot its own dependencies: no navigation state, no hydrated store, no React context. Write the drain so it can be called with nothing but a database handle and an API client.
- For file uploads that must finish after the app is suspended, use a library backed by the platform's background transfer rather than `fetch`.

## Idempotency and conflicts

- Send the entry id as `Idempotency-Key`; `fetch` and `axios` will not retry for you, but the platform layer and proxies can re-send, and the user will retry by hand.
- `axios-retry` or an interceptor is fine for *transient* in-session retries, but the durable retry schedule must live in the outbox, because the interceptor dies with the process.
- Send `If-Match` with the stored ETag on updates and treat `412` as the conflict signal, applying the per-entity strategy from the skill's §6. Send only changed fields; a full-object PUT turns every concurrent edit into a conflict.

## Testing

- Unit-test the outbox against an in-memory or temp-file SQLite database; ordering, collapsing, dead-lettering and transaction atomicity need no device.
- Fake the API module (`jest.mock`) or use MSW to express the cases that matter: a response lost after the server committed, and a `412` conflict. Mocking `fetch` at the global level is enough for both.
- Use fake timers for backoff, and inject the clock rather than calling `Date.now()` inside the retry logic.
- End-to-end: Detox and Maestro can toggle device connectivity around a scripted flow; combine with `adb shell am kill` or Detox's `device.terminateApp()` to cover process death mid-drain.

## Official documentation

- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Expo TaskManager: https://docs.expo.dev/versions/latest/sdk/task-manager/
- NetInfo: https://github.com/react-native-netinfo/react-native-netinfo
- React Native AppState: https://reactnative.dev/docs/appstate
- TanStack Query offline support: https://tanstack.com/query/latest/docs/framework/react/guides/network-mode
- WatermelonDB sync: https://watermelondb.dev/docs/Sync/Intro
