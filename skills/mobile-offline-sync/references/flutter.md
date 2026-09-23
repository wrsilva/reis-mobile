# Offline sync in Flutter

Flutter has no built-in persistence, so the first decision is the store. The second is where the sync engine lives: it must outlive any widget, so it belongs in a repository/service registered in the app's DI container — never in a `State` object, and never behind a `ChangeNotifier` that a route disposes.

## The local store

| Package | Fits when | Notes |
|---|---|---|
| `drift` | You want SQL, migrations and typed reactive queries | `Stream` per query out of the box; the usual default for a real offline store |
| `sqflite` | You want SQLite with no code generation | You write the SQL, the mapping and the change notifications yourself |
| `objectbox`, `isar`, `realm` | Object graphs, heavy local querying | Check the package's current maintenance status and platform support before adopting it |
| `hive` / `shared_preferences` | Key–value settings, a small cache | Not a store for records you query, filter or sync per field |
| `cloud_firestore` | The backend is Firestore | Offline persistence and conflict handling are built in; see [mobile-firebase](../../mobile-firebase/SKILL.md) |

Whatever the choice, model the sync state as columns on the record — `syncStatus`, `serverVersion`, `updatedAt`, `lastError` — and expose reads as `Stream`s so the UI reflects an applied mutation without a refresh call.

## The outbox

A table, not a list:

```dart
// drift
class Outbox extends Table {
  TextColumn get id => text()();                       // client UUID = idempotency key
  TextColumn get entityType => text()();
  TextColumn get entityId => text()();
  TextColumn get operation => text()();                // create | update | delete
  TextColumn get payload => text()();                  // JSON of changed fields only
  IntColumn  get attempts => integer().withDefault(const Constant(0))();
  DateTimeColumn get nextAttemptAt => dateTime()();
  TextColumn get lastError => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  @override Set<Column> get primaryKey => {id};
}
```

Enqueue the outbox entry and apply the optimistic local change **in one transaction**. If they are separate writes, a crash between them leaves the UI showing an edit that will never be sent, or sends an edit the UI never showed.

## Draining

```dart
Future<void> drain() async {
  if (_draining) return;            // single-flight: reconnect events arrive in bursts
  _draining = true;
  try {
    for (final entry in await _outbox.dueEntriesInOrder()) {
      try {
        await _api.send(entry, idempotencyKey: entry.id);
        await _db.transaction(() async {
          await _outbox.delete(entry.id);
          await _records.markSynced(entry.entityId);
        });
      } on ApiException catch (e) when (e.isPermanent) {
        await _outbox.deadLetter(entry.id, e.message);   // do not block the queue
      } on Exception catch (e) {
        await _outbox.scheduleRetry(entry.id, backoffFor(entry.attempts + 1), e.toString());
        if (e is SocketException) break;                 // offline again: stop early
      }
    }
  } finally {
    _draining = false;
  }
}
```

Points that reviews catch: the `_draining` guard, deleting the entry only after the call returned, doing the delete and the record update in one transaction, and breaking out of the loop when the device is offline instead of failing every remaining entry and burning its attempt count.

## Triggers and connectivity

- `connectivity_plus` reports the **interface**, not reachability — Wi-Fi with a captive portal reports Wi-Fi. Use its stream as a trigger to try, and treat a successful request as the only proof. `internet_connection_checker_plus` adds an actual reachability probe if you want one, but a real API call is just as good a probe.
- `WidgetsBindingObserver.didChangeAppLifecycleState` → drain on `resumed`.
- Background drains go through the `workmanager` plugin (or an equivalent) with the platform constraints from [background.md](../../mobile-performance/references/background.md) — remember the background isolate has no access to your DI container and must build its own, and that iOS gives no guaranteed schedule.
- Never a `Timer.periodic`.

## Retries

Dart has no built-in backoff. Either use `package:retry` or compute it yourself, and always add jitter:

```dart
Duration backoffFor(int attempt) {
  final base = Duration(seconds: 1 << attempt.clamp(0, 6));  // 1s … 64s
  final jitter = Random().nextInt(base.inMilliseconds ~/ 2);
  return base + Duration(milliseconds: jitter);
}
```

Retry on `SocketException`, `TimeoutException`, and 5xx/408/429. Do not retry other 4xx — dead-letter them. If the HTTP client is Dio, `dio_smart_retry` or a custom `Interceptor` can hold this, but keep the *scheduling* in the outbox: an interceptor that retries in-process loses the retry when the app is killed.

## Testing the failure cases

- Fake the API layer, not `http`: a `FakeApi` that can return success-after-committing (case 2 in the skill's §9) and a stale-version conflict (case 4) makes those tests deterministic. Mocking at the socket level cannot express "the server committed but the response was lost".
- `drift` runs on an in-memory database (`NativeDatabase.memory()`), so outbox behaviour — ordering, collapsing, dead-lettering, transaction atomicity — is a fast unit test with no device.
- Process-death (case 1) is an integration test: enqueue, close the database, reopen it, drain.
- Use `fakeAsync` or an injected clock for backoff timing; never `await Future.delayed` in tests.
- Device-level network throttling: the iOS Network Link Conditioner and the Android emulator's network profile settings.

## Official documentation

- Flutter persistence cookbook: https://docs.flutter.dev/cookbook/persistence
- drift: https://drift.simonbinder.eu/
- connectivity_plus: https://pub.dev/packages/connectivity_plus
- workmanager: https://pub.dev/packages/workmanager
- Cloud Firestore offline data: https://firebase.google.com/docs/firestore/manage-data/enable-offline
