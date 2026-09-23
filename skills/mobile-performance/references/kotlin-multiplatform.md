# Performance in Kotlin Multiplatform

A KMP performance problem is either **shared Kotlin cost**, which shows up on both targets, or a **target-specific consequence** — the Kotlin/Native binary on iOS, the interop boundary, or the host UI. Deciding which comes first is the whole job: optimizing shared code that is not the bottleneck is wasted work, and so is profiling the Android host for a cost that lives in `commonMain`.

Related material already in this plugin: [`mobile-kmp/references/build-performance.md`](../../mobile-kmp/references/build-performance.md) and [`source-sets.md`](../../mobile-kmp/references/source-sets.md).

## 1. Split shared cost from host cost

Run the same journey on both hosts and compare:

| Observation | Where the cost lives |
|---|---|
| Slow on Android and iOS, similar magnitude | Shared Kotlin: algorithm, serialization, database access in `commonMain` |
| Slow only on iOS | Kotlin/Native: memory management, the Swift/Kotlin bridge, a suspend function crossing into Swift, framework initialization |
| Slow only on Android | The Android host: Compose recomposition, main-thread work in the ViewModel, `ContentProvider` initializers |
| Both slow, different symptoms | Two problems. Fix them separately |

Then profile with the host's own tools — there is no KMP profiler. Android Studio Profiler and Macrobenchmark for the Android host ([android.md](android.md)); Instruments for the iOS host ([ios.md](ios.md)), where Kotlin frames appear once the framework's dSYM is available to the trace.

Benchmark the shared code directly where you can: `kotlinx-benchmark` runs the same benchmark on JVM and Native targets, which is the only way to compare the two compilers' output for your algorithm rather than guessing.

## 2. The interop boundary

Every call from Swift into the generated framework crosses a bridge. One call per frame is free; one call per list row per frame is not.

- **Batch the crossing.** Return a whole page of prepared view state in one call instead of exposing a getter per field. The shared layer should expose data already shaped for the screen.
- **Suspend functions and `Flow` become callbacks in Swift.** Each emission crosses the boundary and hops a dispatcher. A `Flow` that emits per keystroke from shared code into SwiftUI is a per-keystroke bridge crossing plus a SwiftUI update — debounce or conflate in shared code, not in Swift.
- **Collections cross by conversion.** A Kotlin `List` handed to Swift is bridged; a large list converted on every access is a hidden O(n) per call. Hold the reference, do not re-fetch.
- **Objective-C interop erases generics and sealed hierarchies**, which pushes Swift callers into exhaustive `switch`es over erased types and sometimes into defensive copies. Design a flat, explicitly-typed API surface at the boundary.

## 3. Kotlin/Native specifics

- The current Kotlin/Native memory manager removes the old freezing rules, so shared mutable state across threads is allowed — but objects still cross into Objective-C autorelease pools, and retain cycles between a Kotlin object and a Swift closure leak exactly like they do in pure Swift. Break them with `[weak self]` on the Swift side and explicit cancellation on the Kotlin side.
- **Framework initialization is launch cost on iOS.** Anything in a Kotlin top-level property with an initializer, or in a Koin/DI module built at framework load, runs before your first screen. Keep it lazy.
- **Framework size** counts against the app's download size. Check `isStatic`, dead-code elimination and whether you export more modules than the host actually calls (`export(...)` in the framework block pulls whole modules into the public API and prevents their elimination).
- Release builds only. Kotlin/Native debug binaries are dramatically slower than release ones, and a "KMP is slow" report measured on a debug framework is a measurement bug.

## 4. Shared code that is usually the bottleneck

- **Serialization.** `kotlinx.serialization` over a large payload on the main dispatcher blocks both hosts. Parse on `Dispatchers.Default`, and parse once — not per screen.
- **Database access.** SQLDelight queries on the calling thread; map rows lazily and do not materialize a whole table to display twenty rows.
- **Flow operators.** An unconfined chain of `map`/`combine` re-running on every upstream emission multiplies work across the boundary. `distinctUntilChanged`, `conflate` and `stateIn` with a sharing policy bound to the host lifecycle keep it bounded.
- **`expect`/`actual` asymmetry.** A cheap JVM implementation and an expensive Native one for the same declaration produces the "slow only on iOS" case above. Measure both actuals.

## 5. Compose Multiplatform UI

When the UI is shared, the Compose performance rules in [android.md](android.md) apply unchanged — stability of parameters, deferred state reads, lazy layouts, `derivedStateOf`. What changes is measurement: the Android host gives you Layout Inspector recomposition counts and composition tracing; on iOS you have Instruments' time profile with Kotlin frames and no recomposition counter, so validate recomposition behaviour on Android and confirm the frame result on iOS.

## 6. Regression detection in CI

- Macrobenchmark on the Android host guards startup and frame time for the shared stack ([android.md](android.md)).
- `XCTApplicationLaunchMetric` on the iOS host guards framework initialization cost ([ios.md](ios.md)).
- `kotlinx-benchmark` on JVM and Native guards the shared algorithms themselves, and is the only gate that fails for a shared-code regression before either host notices.
- Track the produced framework size and the Android AAB size per build; an `export(...)` added to the framework block can move both without any UI change.

## Official documentation

- Kotlin Multiplatform documentation: https://kotlinlang.org/docs/multiplatform.html
- Kotlin/Native memory management: https://kotlinlang.org/docs/native-memory-manager.html
- Swift/Objective-C interop: https://kotlinlang.org/docs/native-objc-interop.html
- kotlinx-benchmark: https://github.com/Kotlin/kotlinx-benchmark
- Compose Multiplatform: https://www.jetbrains.com/help/kotlin-multiplatform-dev/compose-multiplatform-and-jetpack-compose.html
