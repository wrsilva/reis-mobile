# Investigating Android ANRs

An ANR (Application Not Responding) is reported when the main thread cannot process an input event for about five seconds, or when a broadcast receiver, service or job does not finish its callback in the time the system allows. The top frame of the main thread is often the victim, not the cause: find what the main thread was waiting for.

## 1. Get the evidence

| Source | What it gives |
|---|---|
| Play Console → Android vitals → ANRs | Clusters with the main thread's stack, affected versions, devices and Android versions |
| Crashlytics or another reporter with ANR support | Main thread stack; other threads depend on the SDK |
| `ApplicationExitInfo` (Android 11+) | `REASON_ANR` exits of previous processes, with `getTraceInputStream()` returning the full thread dump — log or upload it on the next launch |
| `adb bugreport` | ANR traces of all threads when reproduced on a test device |
| Local reproduction | `adb logcat` shows `ANR in <package>` with the reason; `StrictMode` flags disk and network on the main thread before it becomes an ANR |

High confidence needs the **whole thread dump**, not only the main thread. With a single stack, say the conclusion is tentative and ask for the full trace.

## 2. Read the reason

- `Input dispatching timed out` → the main thread did not handle a touch or key event in time.
- `Broadcast of Intent { ... }` / `executing service` / `ContentProvider not responding` → a component callback ran too long on the main thread.
- `Context.startForegroundService() did not then call Service.startForeground()` → the service did not promote itself in time. On recent Android versions this is reported as a crash (`ForegroundServiceDidNotStartInTimeException`) as well.

## 3. Read the main thread's state

In the dump, find `"main" prio=5 tid=1 <State>`:

| State | Look for |
|---|---|
| **Runnable** | Work on the main thread: JSON parsing, database queries, `SharedPreferences.commit()`, file I/O, bitmap decoding, crypto, class loading of large SDKs, a loop in layout or composition |
| **Blocked** | `- waiting to lock <0x...> held by thread N`: open thread N and see what it does while holding the lock |
| **Waiting / TimedWaiting** | `Object.wait`, `Future.get`, `CountDownLatch.await`, `Thread.join`, `runBlocking`, a `Semaphore` or `Mutex`: find who should release it |
| **Native** | Binder calls into system services (`BinderProxy.transact`), `SharedPreferences` `apply()` flushing in `QueuedWork.waitToFinish` during `onPause`/`onStop`, file system or graphics calls |

For a deadlock, write down the cycle: thread A holds lock 1 and waits for lock 2; thread B holds lock 2 and waits for lock 1.

## 4. Match the code

- `runBlocking` anywhere reachable from the main thread, including inside interceptors, `ContentProvider`s and DI factories.
- `@Synchronized` or `synchronized` blocks that also do network or disk work: the lock is held for the whole I/O.
- Eager initialization in `Application.onCreate`, `ContentProvider.onCreate` (including library initializers) or the first Activity.
- Room queries without `suspend`/`Flow`, or with `allowMainThreadQueries()`.
- `BroadcastReceiver.onReceive` doing work beyond starting a `WorkManager` job; `goAsync()` without calling `finish()`.
- `SharedPreferences.apply()` writes piling up and flushed on lifecycle transitions: move hot data to DataStore.
- Third-party SDK calls that are synchronous on first use (ads, analytics, feature flags).

## 5. Fix

- Remove the blocking path that the evidence proves, not the top frame. Moving work to `Dispatchers.IO` fixes main-thread I/O; it does not fix a lock held across I/O — shorten the critical section instead.
- Replace `runBlocking` with a suspending call chain, or with an in-memory value that is refreshed asynchronously.
- Defer SDK initialization (App Startup with lazy initializers, or initialization after the first frame).
- Keep receivers, services and job callbacks short; hand long work to `WorkManager`.
- Do not trade an ANR for lost work or a race: if the result is needed, expose loading state instead of blocking.

## 6. Verify

- Reproduce with the slow dependency made slower (a delay in the network call or the lock owner) on a low-end device or emulator with a cold start.
- `StrictMode.ThreadPolicy` with `detectAll()` in debug builds shows no violations on the path.
- A system trace (Perfetto, Android Studio's CPU profiler) shows the main thread free during the flow. See `mobile-android` → the profiler guide.
- After release, watch the cluster and the user-perceived ANR rate in Android vitals for the new version.
