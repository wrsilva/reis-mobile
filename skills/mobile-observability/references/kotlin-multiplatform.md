# Observability in Kotlin Multiplatform

Two things are shared and one is not. The **instrumentation** — what you record, the event names, the attributes, the sampling decision, the redaction rules — belongs in `commonMain`, so both apps report the same names and a dashboard can compare them. The **reporting SDK** is per host: Crashlytics/Sentry on Android through the Android SDK, the same vendor on iOS through its Apple SDK. There is no cross-platform crash reporter that covers Kotlin/Native crashes as well as each platform's native reporter does.

## The boundary

```kotlin
// commonMain — the only API the shared code knows about
interface Telemetry {
    fun breadcrumb(name: String, attributes: Map<String, String> = emptyMap())
    fun setKey(key: String, value: String)
    fun recordError(throwable: Throwable, fatal: Boolean = false)
    fun startSpan(name: String): Span
}
```

`androidMain` implements it over the Android SDK; `iosMain` implements it over the Apple SDK, or the iOS app injects a Swift implementation through the interface. Prefer injection from the host over `expect`/`actual` here: it keeps the vendor out of the shared dependency graph and makes `commonTest` a matter of passing a recording fake.

Everything else — which events exist, their attribute keys, the sampling rate, the redaction — lives in `commonMain` and is tested once.

## Kotlin/Native crashes on iOS

This is the part that surprises teams:

- An **unhandled Kotlin exception on iOS terminates the process**. By default it is reported as a native crash, and the report's usefulness depends entirely on the framework's dSYM being uploaded alongside the app's.
- `setUnhandledExceptionHook` lets you record the Kotlin exception through the host reporter *before* the process dies — use it to attach the shared-layer context (the screen, the operation, the outbox depth) that a raw native crash report will not carry. Do not use it to swallow the exception.
- Kotlin frames appear as addresses unless the framework is built with debug symbols and those symbols are uploaded. Check `binaryOptions` and the framework build configuration, and verify once with a deliberate release crash from shared code.
- `kotlin.native.binary.` options that strip symbols will make every shared-code crash unreadable. Confirm what the release framework actually ships.

On Android the shared code is ordinary JVM code: Kotlin exceptions reach the default uncaught handler and the reporter sees them normally, symbolicated through the R8 mapping file.

## Instrumenting the shared layer

- **Ktor:** a client plugin is the single place to generate the request id, add the header, record the span and drop a network breadcrumb — for both platforms at once.

```kotlin
val client = HttpClient {
    install(createClientPlugin("Observability") {
        onRequest { request, _ ->
            request.headers.append("X-Request-Id", uuid4().toString())
        }
        onResponse { response ->
            telemetry.breadcrumb("network", mapOf(
                "host" to response.request.url.host,          // host only, never the full URL
                "status" to response.status.value.toString(),
            ))
        }
    })
}
```

- **Repository and sync errors:** the shared sync engine ([mobile-offline-sync](../../mobile-offline-sync/SKILL.md)) is where the most valuable context lives — outbox depth, attempt counts, conflict outcomes. Record it as keys and breadcrumbs from `commonMain` so both apps report it identically.
- **Coroutine failures:** an exception in a shared `CoroutineScope` with no handler is lost. Install a `CoroutineExceptionHandler` that routes to `Telemetry.recordError`, and remember that a failing child in a plain `Job` cancels the scope — the report must say which.
- **Spans:** `OSSignposter` on iOS and trace sections on Android are host concerns; expose `startSpan` and let each `actual` map it, so the same span name shows up in Instruments and in a system trace.

## Segmentation

The dimensions in the skill's §4 apply, plus one KMP-specific pair worth setting as keys: the **shared module version** (if it is versioned independently of the apps) and the **target**. "Only on iOS" is the single most useful filter in a KMP dashboard, and it only exists if the target is an attribute on every signal.

## Platform field data

Android vitals, Play Console ANRs, Xcode Organizer and MetricKit all apply unchanged — the shared code runs inside two ordinary apps. See [android.md](android.md) and [ios.md](ios.md). The lab counterpart, including how to tell shared cost from host cost, is [mobile-performance/references/kotlin-multiplatform.md](../../mobile-performance/references/kotlin-multiplatform.md).

## Testing

- A recording fake `Telemetry` in `commonTest` asserts that a failing sync drain records the error once, with the expected keys, and does not log the payload.
- The redaction rules are shared code: test them against a payload containing a token, on both JVM and Native test targets.
- Sampling decisions should be deterministic given an injected seed or clock, so the test can assert "a failed session is always kept".

## Official documentation

- Kotlin Multiplatform: https://kotlinlang.org/docs/multiplatform.html
- Kotlin/Native and Swift/Objective-C interop: https://kotlinlang.org/docs/native-objc-interop.html
- Ktor client plugins: https://ktor.io/docs/client-custom-plugins.html
- Crashlytics: https://firebase.google.com/docs/crashlytics
- MetricKit: https://developer.apple.com/documentation/metrickit
