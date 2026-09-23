# Performance on native iOS

iOS performance work is mostly main-thread work. The main thread renders, handles touch and runs SwiftUI/UIKit updates; anything that blocks it becomes a hitch, a hang or a watchdog termination. Instruments explains a single run, MetricKit and Xcode Organizer explain the installed base.

Related material already in this plugin: [`mobile-ios/references/performance-release.md`](../../mobile-ios/references/performance-release.md).

## Measure

**Release configuration, physical device.** The Simulator has a different GPU path and no thermal or memory pressure; debug builds skip optimization and enable extra checks.

| Question | Tool |
|---|---|
| Where CPU time goes | Instruments → Time Profiler, with "Record Waiting Threads" to catch blocking |
| Why a scroll drops frames | Instruments → Animation Hitches (hitch time per frame, scroll and commit phases) |
| What SwiftUI is doing and why a view updated | Instruments → SwiftUI template; `Self._printChanges()` inside `body` in debug |
| Main thread blocked | Instruments → Hangs; the Thread Performance Checker in a debug run |
| Allocations, growth and leaks | Instruments → Allocations (mark generations around the journey) and Leaks; the Memory Graph Debugger for retain cycles |
| Launch cost | Instruments → App Launch; `DYLD_PRINT_STATISTICS=1` for pre-main dynamic linking time |
| Field data from real users | MetricKit (`MXMetricManager`), and Xcode Organizer → Launch Time, Hangs, Memory, Disk Writes, Battery |
| Download size | App Store Connect → App Store → the build's app size report, per device variant |

Apple treats the main thread being blocked for more than about 250 ms as a hang; Organizer reports it as a hang rate per hour of use. A scroll hitch is measured as *hitch time ratio* — milliseconds of hitch per second of scrolling.

## Launch

Launch splits into pre-main (dynamic linker, runtime setup) and post-main (your `AppDelegate`/`App` initialization up to the first usable frame). Apple's guidance is to finish launch in roughly 400 ms, before the system's launch animation ends.

- **Pre-main:** the number of dynamically linked frameworks dominates. Merge small dynamic frameworks into static libraries or use mergeable libraries; remove `+load` methods and heavy static initializers (`__attribute__((constructor))`, non-lazy Swift globals with side effects).
- **Post-main:** every SDK initialized synchronously in `application(_:didFinishLaunchingWithOptions:)` is launch cost. Defer analytics, remote config, crash-symbol upload and network prefetch to after the first frame. Read persisted state asynchronously; `UserDefaults` is cheap but a Core Data or SwiftData stack opened on the main queue is not.
- **Measure the right end point.** `os_signpost` a span from `didFinishLaunching` to the moment content is on screen, and query it in a UI test with `XCTOSSignpostMetric`.

```swift
import XCTest

final class LaunchTests: XCTestCase {
    func testLaunchPerformance() {
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }
}
```

`measure(metrics:)` records a baseline in the test bundle and fails the test when a later run regresses past the configured deviation — this is the cheapest regression gate on iOS.

## SwiftUI updates

- **Identity drives everything.** A view whose identity changes is torn down and rebuilt; a `ForEach` over indices instead of stable `id`s rebuilds every row on any change. Use `Identifiable` with an id that survives a refresh.
- **Narrow what `body` observes.** With `@Observable`, SwiftUI tracks the exact properties read inside `body`; reading a whole model object where one property is needed widens the dependency. With `ObservableObject`, every `@Published` change invalidates every observer — split the object instead.
- `Self._printChanges()` at the top of `body` prints which dependency caused the update. It is the fastest way to answer "why did this redraw".
- **Lazy containers for long content:** `LazyVStack`/`LazyHStack` inside a `ScrollView`, or `List`. A plain `VStack` in a `ScrollView` builds every row.
- **`AnyView` and heavy type erasure** defeat structural identity and the diffing fast path; prefer `@ViewBuilder` and generics.
- **Expensive work in `body`.** `body` may run many times per frame. Format dates, sort and filter outside it, in the model.

For UIKit: cell reuse (`dequeueReusableCell`), self-sizing cells with cached heights, `UICollectionViewDiffableDataSource` over `reloadData`, image decoding off the main thread (`UIImage.prepareForDisplay`/`preparingForDisplay`), and avoiding `layoutIfNeeded` inside `layoutSubviews`.

## Memory

- Retain cycles are the dominant leak: a closure capturing `self` strongly in a long-lived object, a delegate declared `strong`, a `Timer` or `NotificationCenter` observer never invalidated, a `Task` that outlives its owner. `[weak self]` in escaping closures and the Memory Graph Debugger's cycle detection cover most of it.
- Images: decode at display size (`UIGraphicsImageRenderer`, `prepareThumbnail(of:)`, or `ImageIO` with `kCGImageSourceThumbnailMaxPixelSize`). Full-resolution decoding into a small view is the standard memory spike.
- `MXAppExitMetric` from MetricKit tells you how often users' apps were terminated for memory pressure in the field — the only reliable signal that the footprint is too large on the devices you actually ship to.

## Concurrency and the main thread

- `@MainActor` isolates UI state; work that is not UI should not be on it. An `actor` or a detached `Task` with an explicit priority keeps parsing and I/O off the main thread.
- A synchronous call into a `DispatchQueue.sync`, a `NSLock`, or an `await` on an actor already busy on the main thread all produce a hang. The Hangs instrument names the blocking frame.
- Background `URLSession` configurations continue transfers after suspension; ordinary sessions do not. See [background.md](background.md).

## Regression detection in CI

- `XCTMetric` based tests (`XCTApplicationLaunchMetric`, `XCTClockMetric`, `XCTMemoryMetric`, `XCTOSSignpostMetric`) with committed baselines fail the build on regression. Run them on a pinned simulator or device model; baselines are per-device.
- Track binary size per build from the archive and compare against the previous baseline.
- Feed MetricKit payloads into your backend so launch, hang and memory metrics have a per-release series. See [mobile-observability](../../mobile-observability/SKILL.md).

## Official documentation

- Improving your app's performance: https://developer.apple.com/documentation/xcode/improving-your-app-s-performance
- Reducing your app's launch time: https://developer.apple.com/documentation/xcode/reducing-your-app-s-launch-time
- Understanding hangs in your app: https://developer.apple.com/documentation/xcode/understanding-hangs-in-your-app
- Analyzing responsiveness issues: https://developer.apple.com/documentation/xcode/analyzing-responsiveness-issues-in-your-shipping-app
- MetricKit: https://developer.apple.com/documentation/metrickit
- Performance tests with XCTest: https://developer.apple.com/documentation/xctest/performance-tests
