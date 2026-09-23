# Performance on native Android

Android gives you more first-party measurement than any other mobile platform: a lab harness (Macrobenchmark), a system trace (Perfetto), and field data from every install (Android vitals). Use them in that order — reproduce in the lab, explain with a trace, confirm in the field.

Deep guides already in this plugin: [`mobile-android/references/build-and-performance.md`](../../mobile-android/references/build-and-performance.md), which links the Android Studio profiler and R8 analyzer material from the Android team.

## Measure

```bash
adb shell am start -W -S com.example/.MainActivity   # TotalTime / WaitTime per cold start
adb shell dumpsys gfxinfo com.example framestats     # per-frame timings
adb shell dumpsys meminfo com.example                # PSS breakdown
adb shell dumpsys batterystats --charged com.example # wakeups, wake locks, jobs
```

| Question | Tool |
|---|---|
| Startup, frame time, memory, power in a repeatable benchmark | Macrobenchmark (`androidx.benchmark:benchmark-macro-junit4`) |
| Cost of one function or algorithm | Microbenchmark (`androidx.benchmark:benchmark-junit4`) |
| Where the time actually goes inside a slow frame or a slow start | System trace / Perfetto (Android Studio "Capture System Activities", or `perfetto` on device) |
| Allocation and leak hunting | Android Studio Profiler: Memory, heap dump, and LeakCanary in debug builds |
| Which composables recompose | Layout Inspector recomposition counts, and composition tracing in a system trace |
| Field jank, ANRs, wakeups, crash rate | Play Console → Android vitals; `JankStats` for your own aggregation |
| Download size | Android Studio APK Analyzer; the Play Console size report for the delivered app |

## Startup

Cold start cost is dominated by four things:

1. **`Application.onCreate` and content providers.** Every library that self-initializes through a `ContentProvider` runs before your first activity. Use `androidx.startup` (`App Startup`) to sequence and lazily defer initializers, and audit the merged manifest for providers you did not add yourself.
2. **Dependency graph construction.** Hilt/Dagger graph building, a Room database opened synchronously, `SharedPreferences` read on the main thread (use `DataStore`, which is async by design).
3. **Missing Baseline Profiles.** Without them, the hot startup and scroll paths run interpreted until JIT catches up. Generate them with `androidx.benchmark`'s `BaselineProfileRule`, ship them through `androidx.profileinstaller`, and add a Startup Profile so the DEX layout matches the startup path. This is often the single largest startup win and needs no application code change.
4. **A first frame that is not the usable frame.** Call `reportFullyDrawn()` (or `FullyDrawnReporter` when several components must finish) so the platform, Macrobenchmark and Play vitals measure time to *usable* content, not time to a spinner.

```kotlin
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule val rule = MacrobenchmarkRule()

    @Test fun coldStart() = rule.measureRepeated(
        packageName = "com.example",
        metrics = listOf(StartupTimingMetric()),
        iterations = 10,
        startupMode = StartupMode.COLD,
    ) {
        pressHome()
        startActivityAndWait()
    }
}
```

`StartupTimingMetric` reports `timeToInitialDisplayMs` and, when `reportFullyDrawn()` is called, `timeToFullDisplayMs`.

## Rendering and recomposition

With `FrameTimingMetric` in Macrobenchmark you get `frameDurationCpuMs` percentiles and `frameOverrunMs` (how far past the deadline a frame went) over a scripted scroll. Anything with a positive P90 `frameOverrunMs` is visible jank.

Compose-specific causes, in the order they usually bite:

- **Unstable parameters.** A composable whose parameter type the compiler cannot prove stable is never skipped. `List<T>` is unstable; `kotlinx.collections.immutable`'s `ImmutableList`, or a `@Immutable`/`@Stable` annotated holder, is stable. Enable the compiler's stability report to see which composables are skippable.
- **Reading state too high.** Reading a `MutableState` in a parent recomposes the parent and everything it emits. Pass a lambda (`() -> Int`) instead of a value, or read it in the smallest child — deferred reads are the standard Compose fix.
- **A derived value recomputed on every frame.** `derivedStateOf` recomputes only when the result changes, which is what you want for `listState.firstVisibleItemIndex > 0`.
- **Lambdas recreated each composition** captured into `remember`-less callbacks, forcing children to recompose.
- **Backwards writes** — writing state during composition — which force an immediate extra pass.

For Views: a deep hierarchy, `ConstraintLayout` nested inside `ConstraintLayout`, `wrap_content` in a `RecyclerView` row forcing remeasure, `notifyDataSetChanged` where `DiffUtil`/`ListAdapter` would update in place, and overdraw (Developer options → Debug GPU overdraw).

## Memory

- A heap dump after the journey, repeated three times, diffed. LeakCanary in debug catches the common lifecycle leaks: an `Activity`/`Fragment` captured in a static field, a listener never unregistered, an inner-class `Handler`, a coroutine launched outside a lifecycle scope.
- Bitmaps dominate mobile heaps. Load at the target size (`BitmapFactory.Options.inSampleSize`, or let Coil/Glide size the request from the view). A full-resolution camera image decoded into a thumbnail is the classic OOM.
- `onTrimMemory`/`ComponentCallbacks2` is a signal, not a fix, but caches should honour it.
- `MemoryUsageMetric` in Macrobenchmark gives a comparable number per run for CI.

## Battery

See [background.md](background.md) for the scheduling rules. On Android specifically, Play Console → Android vitals reports **excessive wakeups** and **stuck partial wake locks** for your installed base; both are actionable without reproducing anything locally. `PowerMetric` in Macrobenchmark measures energy per benchmark on supported devices, and Battery Historian parses a `batterystats` dump into a timeline.

## App size

- `isMinifyEnabled = true` and `isShrinkResources = true` on release, with R8 full mode, plus per-ABI/density/language splits through the App Bundle — Play generates them automatically from an AAB.
- APK Analyzer shows the DEX method counts and resource weight; compare two builds directly in it.
- Check the size delta in CI by building the release AAB and comparing the `.aab` size with the previous baseline. Set the threshold as a percentage, since ordinary feature work moves it slowly.

## Regression detection in CI

Macrobenchmark emits JSON (`*-benchmarkData.json`) with the metric percentiles. Run it on a fixed emulator image or a device farm profile, store the JSON per build, and compare `timeToInitialDisplayMs` P50/P90 and `frameOverrunMs` P90 against the previous baseline. Microbenchmark output is more sensitive to CPU throttling; pin the device and discard the first iterations.

## Official documentation

- App startup time: https://developer.android.com/topic/performance/vitals/launch-time
- Macrobenchmark: https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview
- Baseline Profiles: https://developer.android.com/topic/performance/baselineprofiles/overview
- Compose performance: https://developer.android.com/develop/ui/compose/performance
- Android vitals: https://developer.android.com/topic/performance/vitals
- Capture a system trace: https://developer.android.com/topic/performance/tracing
