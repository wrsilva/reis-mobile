---
name: mobile-performance
description: Diagnoses and prevents mobile performance regressions on every stack — Flutter, native Android, native iOS, React Native and Kotlin Multiplatform. Covers startup time, rendering and jank, memory, battery and background work, app size, the profiler and benchmark to use on each platform, and regression detection in CI. Use when an app is slow, janky, heavy or draining the battery, when setting performance budgets, or when a release must not regress.
intents: [performance]
stacks: ["*"]
---

# Mobile Performance

One performance process for every mobile stack. This file holds the method and the budgets; each platform's profilers, benchmark harnesses and fixes live in its reference.

## 1. Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Native Android: Jetpack Compose or Views | [references/android.md](references/android.md) |
| Native iOS: SwiftUI or UIKit | [references/ios.md](references/ios.md) |
| React Native or Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform, shared code and hosts | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |
| Battery drain, background jobs, wake locks, scheduled sync | [references/background.md](references/background.md) |

In Flutter, React Native and KMP apps, the native reference applies to the host side of the problem: the Android or iOS process still owns startup, frame delivery and battery accounting.

## 2. Never optimize before you measure

A performance task that starts with a code change is a guess. Produce these four things, in order, before touching anything:

1. **A journey.** "Cold start to the feed", "scrolling the order list", "typing in the search field". Not "the app is slow".
2. **A number and a device.** The current value, the device model, the OS version, and the build type. A debug build proves nothing: Flutter and React Native run unoptimized in debug, and Android/iOS debug builds disable compiler optimizations. Measure in profile or release.
3. **A budget.** The value that makes the journey acceptable (see §3).
4. **A repeatable measurement.** The exact command, trace or benchmark that produced the number, so the fix can be proven and the regression can be caught later.

If the request arrives without a measurement, say so and give the command that produces one for this stack before proposing fixes. Reporting "I optimized X" without a before and after number is not a result.

## 3. The budgets

**Startup.** Distinguish the three: *cold* (process created), *warm* (process alive, activity/scene recreated) and *hot* (resume). Cold start is the one users judge. Measure to first frame and to the first frame the user can actually use — these differ whenever the first frame is a skeleton or spinner.

| Signal | Usable budget |
|---|---|
| Cold start to first frame | under ~1.5 s on a mid-range device; Android vitals flags 5 s as excessive for cold start |
| Cold start to interactive content | under ~2.5 s, with a meaningful placeholder before it |
| Warm start | under ~1 s |

**Rendering.** The budget is one frame period: about 16.7 ms at 60 Hz, about 8.3 ms at 120 Hz. Two numbers matter, and an average hides both:

- **p90/p99 frame time** — the slow frames are the ones the user sees.
- **Frozen frames** — anything over ~700 ms of unresponsiveness reads as a freeze; Android vitals counts frames over 700 ms as frozen, and Apple counts a main thread blocked beyond ~250 ms as a hang.

Never report "average frame time is fine". Report the percentile and the count of dropped frames over the journey.

**Memory.** Track the steady-state footprint after the journey has run several times, not the peak during one load. The failure modes are: growth that never comes back down (a leak), a peak that gets the process killed on low-memory devices, and bitmap/image decoding at a size far larger than the view. Compare the same journey repeated three times: flat is healthy, monotonically rising is a leak.

**Battery and network.** Energy is not measured in the app's UI; it is measured in wakeups, wake locks, jobs, and bytes transferred while the screen is off. Anything periodic — polling, a foreground service kept alive, location updates, an unbatched analytics flush — is the first suspect. See [references/background.md](references/background.md).

**App size.** Download size, not the size of the build directory. Size is a conversion and update-adoption problem, and on Android it is also a Play Console limit. Every stack ships a size analyzer; the reference names it.

## 4. Find the cause, not a symptom

Rendering problems come from one of four places. Identify which before proposing a fix:

1. **Too much work per frame on the UI thread** — layout of a deep tree, a synchronous decode, JSON parsing, a database read, a `List`/`ListView` that builds all children.
2. **Too many updates** — a state container that emits on every keystroke, a widget/composable/component that rebuilds because its input is not stable, an animation driven from the JS or UI thread instead of the compositor.
3. **Expensive painting** — overdraw, shadows and blurs over large areas, clipping with antialiasing and saved layers, oversized images.
4. **Blocking the main thread from elsewhere** — an await that resolves on the main queue, a lock, a plugin/native module call that is synchronous, a file or network call that should be off-thread.

Startup problems are usually: work done eagerly in the application/AppDelegate entry point that could be deferred, dependency-injection graphs built at launch, a synchronous read of preferences or a database, third-party SDKs initialized before first frame, and — on Android — missing Baseline Profiles so hot code runs interpreted.

## 5. Detect the regression before the user does

A performance fix that is not guarded comes back. Every stack has a benchmark harness that produces a number in CI; the reference names it. Set it up so that:

- The benchmark runs on a fixed device or emulator/simulator model, in release or profile mode, with the app warmed the same way each run.
- The result is compared against a stored baseline, and the build fails (or flags) past a threshold — an absolute budget for startup and frame time, and a percentage delta for size.
- Percentiles, not averages, are compared, and the run count is high enough that the noise band is known. Report the noise band with the threshold; a 5% threshold on a benchmark with 15% variance only produces false alarms.
- Field data backs the lab data: Android vitals and Play Console, Xcode Organizer and MetricKit, or the app's own tracing. Lab benchmarks catch a regression before release; field metrics tell you whether it mattered. See [mobile-observability](../mobile-observability/SKILL.md) for wiring these signals into production.

## 6. Evidence and severity

Point to `file:line` for every finding, name the measurement that proves it, and give the fix in the platform's own API.

- **Critical:** the journey is unusable or the process dies — ANR or a hang over a few seconds, an out-of-memory kill, a cold start past 5 s, a leak that grows until the app is terminated.
- **High:** the user perceives it every time — visible jank on the main scroll, cold start over budget, battery drain flagged by the platform, an app size jump that breaks a store limit.
- **Medium:** measurable but intermittent — occasional dropped frames, a redundant rebuild, a cache miss that costs a network round trip.
- **Low:** headroom — work that could be deferred or batched without a current user-visible cost.

Say which findings came from reading code only. Code review can prove an unbounded list build or a main-thread file read; it cannot prove frame time, memory growth or energy use. Those need the profiler run named in the reference.
