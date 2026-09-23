# Observability on native iOS

Apple's own telemetry is good and under-used: **MetricKit** delivers per-device diagnostics and metrics to your app, and **Xcode Organizer** aggregates crashes, hangs, launch time, memory, disk writes and battery per release from users who opted into sharing. Both are free, privacy-reviewed and need no SDK. Add a third-party reporter for the context they do not carry — breadcrumbs, custom keys, correlation ids.

## What you get from Apple

| Source | Gives |
|---|---|
| Xcode Organizer → Crashes | Symbolicated crash reports per version, grouped, from opted-in users |
| Xcode Organizer → Hangs, Launches, Memory, Disk Writes, Battery | Field metrics per version, with a comparison to the previous release |
| MetricKit (`MXMetricManager`) | Daily metric payloads (`MXAppLaunchMetric`, `MXAnimationMetric`, `MXAppExitMetric`, `MXSignpostMetric`, and more) and diagnostic payloads (crash, hang, disk-write, CPU exception) delivered **into your app**, so you can forward them to your own backend |

`MXAppExitMetric` is the one to wire up first: it reports how sessions ended, including **memory-pressure terminations and watchdog kills**, which produce no crash report and are otherwise invisible.

```swift
final class MetricsSubscriber: NSObject, MXMetricManagerSubscriber {
    func didReceive(_ payloads: [MXMetricPayload]) {
        for payload in payloads {
            backend.upload(payload.jsonRepresentation(), kind: "metric")
        }
    }

    func didReceive(_ payloads: [MXDiagnosticPayload]) {
        for payload in payloads {
            backend.upload(payload.jsonRepresentation(), kind: "diagnostic")   // hangs and crashes
        }
    }
}

// In application(_:didFinishLaunchingWithOptions:)
MXMetricManager.shared.add(subscriber)
```

Payloads arrive **once a day, about the previous day** — plan the dashboard around that delay rather than expecting live data.

## Crash and error reporting

- **dSYMs must reach the reporter for every build.** With bitcode gone this is a straightforward upload, but it still breaks constantly: Xcode Cloud, a CI cache, or `DEBUG_INFORMATION_FORMAT` set to `dwarf` instead of `dwarf-with-dsym` will all produce unreadable release crashes. Run the vendor's upload script as a build phase *and* verify in CI, then prove it once with a deliberate release crash.
- **Swift errors are not exceptions.** A crash reporter sees `fatalError`, force-unwraps, array bounds, and signals — not a `throw` you caught. User-visible failures from `catch` blocks must be reported explicitly as non-fatals, with the state that explains them.
- **Custom keys** per session: scene/screen, auth state, flag values, outbox depth, connectivity (`NWPathMonitor`'s current path).
- **Grouping** follows the stack signature. A generic `AppError.wrapped(Error)` rethrown from one place collapses unrelated failures into one issue; keep the original error type and domain in the report.

## Hangs

Apple treats the main thread being unresponsive beyond roughly 250 ms as a hang, and Organizer reports a hang rate per hour of use.

- Organizer → Hangs and MetricKit's hang diagnostics give the field data with a stack.
- The Thread Performance Checker (a debug-time diagnostic) catches main-thread file I/O and priority inversions before they ship.
- Diagnose with Instruments — see [mobile-performance/references/ios.md](../../mobile-performance/references/ios.md).

Watchdog terminations (`0x8badf00d`) are hangs that lasted long enough to be killed; they appear in `MXAppExitMetric` and in Organizer, not as ordinary crashes.

## Logs, traces and metrics

- **`OSLog` / `Logger` is the system logger**: structured, privacy-aware, and cheap. It does **not** leave the device — treat it as what you read on a connected device or in a sysdiagnose, and forward what you need to your reporter separately.
- Mark values explicitly: `logger.info("order \(id, privacy: .private) failed with \(code, privacy: .public)")`. Dynamic strings default to private and are redacted in collected logs — deliberately marking a secret `.public` is the mistake to look for in review.
- **Signposts** (`OSSignposter`) mark intervals that Instruments can read *and* that MetricKit aggregates as `MXSignpostMetric` from the field — the same instrumentation serves the lab and production.
- **Network correlation:** a `URLProtocol`, a custom `URLSessionTaskDelegate`, or a thin client wrapper generates the request id, adds the header, records the duration and drops a breadcrumb with **host and status only** — never the full URL or the body.

```swift
var request = URLRequest(url: url)
let requestID = UUID().uuidString
request.setValue(requestID, forHTTPHeaderField: "X-Request-Id")
```

- **OpenTelemetry** has a Swift implementation for teams already running an OTel backend and wanting `traceparent` propagation into server traces; check the current maturity of the package before adopting it.

## Privacy and consent

- The **privacy nutrition label** and the **privacy manifest** (`PrivacyInfo.xcprivacy`) must cover everything collected, including by third-party SDKs — and SDKs on Apple's required-reason list must ship their own manifest and signature. A reporter added for observability changes your declared data collection.
- **App Tracking Transparency** applies to tracking across apps and websites, not to first-party crash reporting; do not conflate them, but do check what your SDK's default configuration sends.
- Gate SDK initialization on consent where consent is required, and use the reporter's own resettable install id rather than `identifierForVendor` if the id must be resettable independently of app removal.
- Implement the vendor's `beforeSend` callback and test it against a payload containing a token.

## CI

- Fail the archive job when dSYM upload did not run, and when `DEBUG_INFORMATION_FORMAT` is not `dwarf-with-dsym` for Release.
- Upload the build's version and build number to the reporter so the release appears immediately.
- Check Organizer's hang rate and crash rate for the previous release before promoting a new one — see [mobile-release](../../mobile-release/SKILL.md).

## Official documentation

- MetricKit: https://developer.apple.com/documentation/metrickit
- Diagnosing issues using crash reports and device logs: https://developer.apple.com/documentation/xcode/diagnosing-issues-using-crash-reports-and-device-logs
- Understanding hangs in your app: https://developer.apple.com/documentation/xcode/understanding-hangs-in-your-app
- Logging with OSLog: https://developer.apple.com/documentation/os/logging
- Recording performance data with signposts: https://developer.apple.com/documentation/os/recording-performance-data
- Privacy manifest files: https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
