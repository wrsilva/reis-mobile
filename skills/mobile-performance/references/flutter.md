# Performance in Flutter

Flutter splits every frame across two threads: the **UI thread** runs `build`, layout and paint (Dart), and the **raster thread** turns the resulting layer tree into GPU commands. A dropped frame belongs to one of them, and the fix is different. DevTools tells you which.

Deep guides already in this plugin: [`mobile-flutter/references/performance.md`](../../mobile-flutter/references/performance.md), with [`app-size.md`](../../mobile-flutter/references/performance/app-size.md) and [`concurrency.md`](../../mobile-flutter/references/performance/concurrency.md).

## Measure

**Always in profile mode.** Debug builds run the Dart VM in JIT with assertions and unoptimized widget code; numbers from `flutter run` in debug are meaningless.

```bash
flutter run --profile                 # on a physical device, never an emulator, for frame data
flutter build apk --analyze-size      # or appbundle / ipa / macos
flutter build apk --split-debug-info=build/symbols --obfuscate
```

| Question | Tool |
|---|---|
| Which thread drops frames | DevTools → Performance → Frames chart (blue = UI, teal = raster) |
| What runs inside a slow frame | DevTools → Performance → Timeline events, then the CPU profiler for the Dart stack |
| Which widgets rebuild, and how often | DevTools → Performance → Track widget builds; `debugProfileBuildsEnabled`, `debugPrintRebuildDirtyWidgets` |
| What repaints | `debugRepaintRainbowEnabled`, and DevTools' "Highlight repaints" |
| Memory growth and leaks | DevTools → Memory: take a snapshot after the journey, repeat it, diff the retained set |
| Startup cost | `flutter run --profile --trace-startup`, which writes `start_up_info.json` with `timeToFirstFrameMicros` and `timeToFrameworkInitMicros` |
| Size | `--analyze-size` output opened in DevTools → App size |

Mark your own expensive spans so they appear on the timeline:

```dart
import 'dart:developer' as developer;

final task = developer.TimelineTask()..start('parseOrders');
final orders = parseOrders(payload);
task.finish();
```

## Rebuilds: the usual causes

- **A `setState`, `notifyListeners` or stream emission high in the tree.** Move the state down to the smallest widget that needs it, or split the widget so only the changing part rebuilds.
- **`const` missing.** A `const` constructor lets the framework skip the subtree entirely. Enable `prefer_const_constructors` in `analysis_options.yaml`.
- **Rebuilding a constant child inside an animation.** Pass it through the `child:` parameter of `AnimatedBuilder`, `ValueListenableBuilder` or `StreamBuilder` so it is built once and reused.
- **A selector that returns a new object every time.** `context.watch<Cart>()` rebuilds on every cart change; `context.select((Cart c) => c.itemCount)` rebuilds only when the count changes. The same applies to `BlocSelector`, Riverpod's `select`, and any `buildWhen`/`listenWhen`.
- **Equality that never holds.** A state class without `==`/`hashCode` (or a freezed/equatable equivalent) makes every emission look new. A `List` field compares by identity: copy it or use an immutable collection.
- **Work in `build`.** `build` can be called many times per second. No parsing, no sorting, no `Future` creation, no controller construction inside it.

## Lists

- `ListView.builder` / `GridView.builder` / `SliverList` with a builder — never a `ListView(children: [...])` over a long collection, which builds every child.
- Give `itemExtent` (or `prototypeItem`) when rows have a fixed height: it lets the framework skip measuring and makes scrolling to an offset O(1).
- Stable `ValueKey`s on items so reorders and inserts do not rebuild everything.
- Wrap an item in `RepaintBoundary` only when it repaints independently of its neighbours (an animating row in a static list). Applied indiscriminately it costs memory and a layer per row.
- `AutomaticKeepAlive` keeps offscreen items alive: useful for a video or a form, expensive for a plain row.

## Painting

- `Opacity` over a large subtree allocates an offscreen layer. Prefer `AnimatedOpacity` on a leaf, `Color.withValues(alpha: ...)`, or `FadeTransition`.
- `ClipRRect` with antialiasing and `Clip.antiAliasWithSaveLayer` is the expensive variant; `Clip.hardEdge` is cheap. A rounded container is cheaper as a `BoxDecoration` with `borderRadius` than as a clip.
- Shadows and blurs (`BackdropFilter`, `ImageFiltered`) scale with the area covered. Constrain them.
- Decode images at the size they are displayed: `cacheWidth`/`cacheHeight` on `Image.asset`/`Image.network`, or `ResizeImage`. A 4000 px photo in a 100 px avatar costs ~64 MB of decoded pixels.
- `SizedBox` instead of `Container` when you only need space; `Container` with no decoration still builds a `LimitedBox`/`ConstrainedBox` chain.

## Off the UI thread

Anything that takes more than a frame belongs in an isolate. `compute()` covers one-shot work (JSON parsing, image manipulation, crypto); `Isolate.run` is the modern equivalent for a single call; a long-lived worker isolate with `ReceivePort` covers repeated work. Remember that only transferable values cross the boundary, and that plugins that need the platform thread cannot be called from a background isolate unless they use a background isolate binary messenger. See [`concurrency.md`](../../mobile-flutter/references/performance/concurrency.md).

## Startup

- Nothing blocking in `main()` before `runApp`. `WidgetsFlutterBinding.ensureInitialized()` plus a single fast await is the ceiling; move plugin initialization, remote config fetches and database opens behind the first frame or into a splash state.
- Deferred loading (`deferred as`) splits rarely used code on web; on mobile it does not remove the code from the binary, so it is not a size fix.
- Confirm which renderer the project actually uses (`flutter --version` and the release notes for the pinned channel). Impeller and Skia have different shader-compilation behaviour, and shader jank fixes that apply to one do not apply to the other.

## Regression detection in CI

`integration_test` produces a machine-readable timeline summary:

```dart
// integration_test/scroll_perf_test.dart
final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

testWidgets('feed scroll stays within budget', (tester) async {
  app.main();
  await tester.pumpAndSettle();

  await binding.watchPerformance(() async {
    await tester.fling(find.byType(ListView), const Offset(0, -500), 3000);
    await tester.pumpAndSettle();
  }, reportKey: 'feed_scroll');
});
```

Run it with `flutter drive` (or `flutter test integration_test` with a driver that writes the report) and assert on the emitted summary: `average_frame_build_time_millis`, `worst_frame_build_time_millis`, `missed_frame_build_budget_count` and the raster equivalents. Store the numbers per build and compare against the previous baseline; fail the job when the worst frame or the missed-budget count crosses the threshold you set in §5 of the skill.

For size, run `flutter build --analyze-size` in CI, extract the total from the JSON it writes, and compare with the baseline.

## Official documentation

- Flutter performance best practices: https://docs.flutter.dev/perf/best-practices
- Flutter performance profiling: https://docs.flutter.dev/perf/ui-performance
- DevTools performance view: https://docs.flutter.dev/tools/devtools/performance
- Measuring app size: https://docs.flutter.dev/perf/app-size
- Integration test performance profiling: https://docs.flutter.dev/cookbook/testing/integration/profiling
