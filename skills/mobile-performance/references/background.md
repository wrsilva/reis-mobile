# Background execution and battery

Battery is not something an app spends; it is something the app makes the *device* spend by waking it, holding it awake, using the radio, or keeping a sensor on. Both platforms now assume that background work is a privilege they grant, not a thread you own — code written as if a background task runs whenever it wants will be deferred, throttled or killed, and the resulting bug report reads as "sync does not work", not as "battery".

## The rule that covers both platforms

**Say what the work needs, let the system choose when.** Declare the constraints (network, charging, idle, deadline), make the work idempotent and resumable, and let the scheduler batch it with other apps' work so the device wakes once instead of five times. Every API below is a variation on that.

**Never poll on a timer.** A periodic wake to ask "is there anything new?" is the single most expensive pattern in mobile, and it is almost always replaceable by a push message that tells the app there *is* something new (see [mobile-firebase](../../mobile-firebase/SKILL.md) for FCM and APNs delivery).

## Android

| Need | API |
|---|---|
| Deferrable work that must survive process death and reboot | `WorkManager` — `OneTimeWorkRequest` / `PeriodicWorkRequest` with `Constraints` |
| Work the user is actively waiting for, right now | `setExpedited(...)` on a `WorkRequest`, or a foreground service with the right type |
| Work tied to a user-visible ongoing task (playback, navigation, an upload the user started) | A foreground service with a declared `foregroundServiceType` and a notification |
| An exact time (an alarm clock, a calendar reminder) | `AlarmManager.setExactAndAllowWhileIdle` — requires the exact-alarm permission on recent versions, and Google Play restricts which apps may declare it |
| A reaction to a server event | FCM data message, high priority only when it is genuinely time-critical |

Rules that break naive code:

- **Doze and App Standby.** With the screen off and the device still, network access and alarms are deferred to maintenance windows; rarely used apps land in restrictive standby buckets with tighter job and alarm quotas. Periodic `WorkManager` work has a minimum interval of 15 minutes and is never exact.
- **Background start restrictions.** An app in the background generally cannot start a foreground service; the allowed cases are enumerated per platform version. Code that "starts a service when the push arrives" is the usual casualty — use expedited work instead.
- **Foreground service types are enforced.** Recent Android versions require a declared `foregroundServiceType`, require a matching permission, and apply timeouts to some types (`dataSync` and `mediaProcessing` among them). Check the behaviour-changes page for the `targetSdk` you compile against before relying on a long-running service.
- **Wake locks.** A partial wake lock never released is reported by Play Console → Android vitals as a stuck wake lock, against your installed base. `WorkManager` holds the wake lock for you; taking one manually is almost always a bug.
- **Batch the radio.** Each transmission wakes the radio and keeps it in a high-power state for seconds afterwards. Batch analytics, logs and telemetry into one flush with a deadline rather than sending per event.

Diagnose with `adb shell dumpsys batterystats --charged <package>` (Battery Historian renders it), and read the Excessive Wakeups and Stuck Partial Wake Locks metrics in Android vitals — those are field data from real installs, which no local run reproduces.

## iOS

| Need | API |
|---|---|
| Short refresh when the system decides the app is likely to be used | `BGAppRefreshTaskRequest` via `BGTaskScheduler` — seconds of runtime |
| Longer maintenance (database compaction, ML model update, bulk upload) | `BGProcessingTaskRequest`, typically run while charging and idle |
| A download or upload that must continue after the app is suspended or terminated | `URLSession` with a **background** configuration, which the system continues out of process |
| Finish a short piece of work when the user leaves the app | `UIApplication.beginBackgroundTask` — roughly half a minute, not a general mechanism |
| React to a server event | APNs; a background (`content-available`) push wakes the app opportunistically and is rate-limited, a user-visible notification is not |

Rules that break naive code:

- Every background identifier must be listed in `Info.plist` under `BGTaskSchedulerPermittedIdentifiers`, registered before the app finishes launching, and matched by the right `UIBackgroundModes` capability. A missing registration is a launch-time exception, not a silent no-op.
- The system decides *whether and when*. There is no guaranteed schedule, and an app the user rarely opens may get no background time at all. Schedule the next request at the end of each run, and treat every run as "do as much as you can, then checkpoint".
- Always set the task's `expirationHandler` and call `setTaskCompleted(success:)`. A task that neither finishes nor expires cleanly costs the app future background time.
- Background `URLSession` delivers completion to the app delegate after relaunch: the download handler must work with no UI and no in-memory state.
- Xcode Organizer and MetricKit report battery and disk-write metrics per release from real devices; `MXAppExitMetric` shows terminations. These are the iOS equivalent of Android vitals.

## Flutter

Flutter's own isolate model does not extend the platform's background allowances — the constraints above still apply, and the plugin you choose is a wrapper over `WorkManager` and `BGTaskScheduler`.

- Background work runs in a **separate isolate** with its own memory: no access to the UI isolate's state, no plugin registry unless the entry point registers it (`@pragma('vm:entry-point')` on the callback, and a background isolate binary messenger for plugins that need one).
- Persist everything the background run produces; the UI isolate will not see in-memory results.
- Verify on both platforms separately. A background plugin that works on Android frequently does nothing on iOS, because Android's 15-minute periodic work has no iOS equivalent.
- For downloads, prefer a plugin backed by the platform's own background transfer (`URLSession` background configuration / `DownloadManager` or `WorkManager`) over a Dart `HttpClient` call in a background isolate, which stops when the process is suspended.

## React Native and Expo

- Expo exposes background work through `expo-task-manager` plus a background task/fetch module; the module name and API have changed across SDK versions, so check the docs for the SDK the project pins before writing code against it.
- Bare React Native uses Headless JS on Android (a JS task run without a UI, started from a native service or a push) and the `BGTaskScheduler`/background-`URLSession` bridges on iOS, usually through a community package.
- The JavaScript runtime is not guaranteed to exist in the background. Any handler must boot its own dependencies, must not assume the navigation state or a store is hydrated, and must finish quickly.
- Both platforms' limits apply unchanged: a JS background handler does not get more runtime than the native API it is wrapping.

## Kotlin Multiplatform

Scheduling is a host responsibility: `WorkManager` in `androidMain`, `BGTaskScheduler` in the iOS host app. Put the *work itself* — the sync algorithm, the queue drain, the conflict resolution — in `commonMain` behind a suspend function, and let each host's scheduler call it. That keeps the retry and idempotency logic in one place and tested once ([mobile-offline-sync](../../mobile-offline-sync/SKILL.md) covers the queue design).

## Reviewing background code

- [ ] Every periodic job has a justification that a push message cannot satisfy.
- [ ] Work is idempotent: running it twice, or being killed halfway, leaves correct state.
- [ ] Constraints are declared (network type, charging, battery not low) instead of checked in code after the wake.
- [ ] Retries use exponential backoff with a cap and a jitter, not a fixed short interval.
- [ ] Network calls are batched; analytics and logs are flushed with a deadline, not per event.
- [ ] Location, Bluetooth scanning and sensors are started for a bounded window and explicitly stopped, at the coarsest accuracy that works.
- [ ] The app degrades correctly when the system grants no background time at all — the user still gets correct data on next launch.

## Official documentation

- Android background work: https://developer.android.com/develop/background-work/background-tasks
- WorkManager: https://developer.android.com/topic/libraries/architecture/workmanager
- Android foreground service types: https://developer.android.com/develop/background-work/services/fgs/service-types
- Optimize for Doze and App Standby: https://developer.android.com/training/monitoring-device-state/doze-standby
- BGTaskScheduler: https://developer.apple.com/documentation/backgroundtasks/bgtaskscheduler
- Using background tasks to update your app: https://developer.apple.com/documentation/backgroundtasks/using-background-tasks-to-update-your-app
- Downloading files in the background: https://developer.apple.com/documentation/foundation/url_loading_system/downloading_files_in_the_background
