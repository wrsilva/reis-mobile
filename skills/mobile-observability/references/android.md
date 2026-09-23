# Observability on native Android

Android is the only mobile platform that gives you meaningful field data **without installing anything**: Play Console's Android vitals reports crashes, ANRs, wakeups, wake locks and rendering for your installed base, sliced by version, device and OS. Start there, then add an SDK for the context vitals cannot give you.

## What you get for free

| Source | Gives |
|---|---|
| Play Console → Android vitals | Crash rate, **ANR rate** and user-perceived ANR rate, excessive wakeups, stuck partial wake locks, slow/frozen frames, app size — all per version and per device model, with bad-behaviour thresholds the store itself acts on |
| `ApplicationExitInfo` | Why the process last died — crash, ANR, low memory, user request, excessive resource use — readable **on the next launch**, including the ANR trace |
| Play Console → Reach and devices | The device/OS distribution you actually ship to, which decides what a "rare" crash really costs |

`ApplicationExitInfo` is the cheapest large win in Android observability and is frequently missing: it is the only way to see background terminations and OOM kills, which produce no crash report at all.

```kotlin
val am = getSystemService(ActivityManager::class.java)
am.getHistoricalProcessExitReasons(packageName, /* pid = */ 0, /* maxNum = */ 5)
    .firstOrNull()
    ?.let { info ->
        crashReporter.log(
            "last_exit reason=${info.reason} status=${info.status} " +
                "importance=${info.importance} description=${info.description}",
        )
        // REASON_ANR carries the ANR trace in info.traceInputStream
    }
```

Report it on the next launch, attached to the session, so an OOM kill becomes a searchable event rather than an unexplained gap.

## Crash and error reporting

Crashlytics (see [mobile-firebase](../../mobile-firebase/SKILL.md)), Sentry, Bugsnag and Embrace all cover JVM crashes, native (NDK) crashes and non-fatals. What matters is the configuration, not the vendor:

- **Mapping file upload for every release variant.** With R8/Proguard enabled, an un-uploaded mapping file produces an unreadable stack trace. The Crashlytics Gradle plugin uploads automatically when `mappingFileUploadEnabled` is on; other SDKs have a Gradle task. Verify it in CI by failing the build when the upload task did not run, and prove it once by symbolicating a deliberate release crash.
- **Native symbols** need a separate upload (`firebaseCrashlytics { nativeSymbolUploadEnabled = true }`, or the vendor's equivalent) or every NDK/Kotlin-Native frame is an address.
- **Custom keys** on every session: screen, auth state, feature-flag values, outbox depth, connectivity class.
- **Non-fatals** for caught failures that the user saw: `FirebaseCrashlytics.getInstance().recordException(e)` — and *not* for every caught exception, or the important one disappears.
- **Preserve the cause chain.** `throw AppException("failed", cause = e)` keeps grouping meaningful; `throw AppException("failed")` collapses every cause into one issue.

## ANRs and hangs

ANRs are the signal Android developers most often miss, because they produce no crash callback.

- Play Console's ANR rate is authoritative and is a store policy threshold.
- `ApplicationExitInfo` with `REASON_ANR` gives the trace on the device.
- Crash reporters detect ANRs with their own watchdogs; treat their counts as an early indicator and Play Console as the truth.
- Diagnose the cause with a system trace and the main-thread stack — see [mobile-performance/references/android.md](../../mobile-performance/references/android.md) and the ANR guide in [mobile-debug](../../mobile-debug/SKILL.md).

## Logs, traces and metrics

- **Structured logs.** `Log.d` goes nowhere in production. Use the reporter's breadcrumb API, or a `Timber`-style tree that forwards structured events to the reporter, and keep the tags bounded.
- **Traces.** Firebase Performance Monitoring gives automatic app-start, screen-rendering and HTTP traces plus `Trace` for custom spans, with no backend work. OpenTelemetry's Android instrumentation is the option when you already run an OTel backend and want `traceparent` propagation into the server traces; check the current stability of the artifacts before adopting them.
- **Custom metrics.** Prefer a small number of counters and durations with bounded attributes (version, screen, result) over free-form events.
- **Network correlation.** An OkHttp `Interceptor` is the natural place to generate and attach the request id, record the span, and add a breadcrumb — one implementation covers Retrofit, Coil and anything else on the same client.

```kotlin
class ObservabilityInterceptor(private val reporter: Reporter) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val requestId = UUID.randomUUID().toString()
        val request = chain.request().newBuilder().header("X-Request-Id", requestId).build()
        val start = SystemClock.elapsedRealtime()
        return try {
            chain.proceed(request).also { response ->
                reporter.breadcrumb(
                    "network",
                    mapOf(
                        "method" to request.method,
                        "host" to request.url.host,            // host, not the full URL
                        "status" to response.code,
                        "ms" to SystemClock.elapsedRealtime() - start,
                        "request_id" to requestId,
                    ),
                )
            }
        } catch (e: IOException) {
            reporter.breadcrumb("network_error", mapOf("host" to request.url.host, "request_id" to requestId))
            throw e
        }
    }
}
```

Note what is absent: no full URL (query strings carry tokens), no headers, no bodies.

## Privacy and consent

- Play requires an accurate **Data safety** declaration covering everything the SDKs collect, including the ones you did not configure yourself. Audit the merged manifest and the dependency list, not just your own code.
- Gate initialization on consent. Analytics collection can be disabled by default in the manifest and enabled after consent (`firebase_analytics_collection_enabled`, `firebase_crashlytics_collection_enabled` and the equivalent runtime setters) — initializing and then hoping the SDK stays quiet is not the same thing.
- Use a resettable id (the reporter's install id, or `AdvertisingIdClient` only if advertising is genuinely the purpose and it is declared). `ANDROID_ID` and any hardware identifier are not acceptable install ids.
- Register a redaction callback / `beforeSend` equivalent and unit-test it against a payload containing a token.

## CI

- Fail the build when the mapping or native-symbol upload task did not run for a release variant.
- Post the build's version name and code into the reporter so a release appears in the dashboard the moment it ships.
- Check Android vitals as part of the staged-rollout gate — see [mobile-release](../../mobile-release/SKILL.md).

## Official documentation

- Android vitals: https://developer.android.com/topic/performance/vitals
- ApplicationExitInfo: https://developer.android.com/reference/android/app/ApplicationExitInfo
- ANRs: https://developer.android.com/topic/performance/vitals/anr
- Crashlytics for Android: https://firebase.google.com/docs/crashlytics/get-started?platform=android
- Firebase Performance Monitoring: https://firebase.google.com/docs/perf-mon/get-started-android
- Play Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
