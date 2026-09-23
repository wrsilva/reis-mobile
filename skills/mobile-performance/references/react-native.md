# Performance in React Native and Expo

A React Native frame crosses three execution contexts: the **JavaScript thread** (your React code), the **native UI thread**, and — with the New Architecture — the shadow tree and Fabric's rendering pipeline. A slow app is slow in one of them, and the fix differs. Identify the thread first.

Related material already in this plugin: [`mobile-rn/references/performance-release.md`](../../mobile-rn/references/performance-release.md).

## Measure

**Release build, physical device, Hermes enabled.** A Metro dev build carries the dev bundle, React strict-mode double renders, and the bridge dev listeners; its numbers are not the shipped app's.

```bash
npx react-native run-android --mode=release
npx expo run:ios --configuration Release
```

| Question | Tool |
|---|---|
| Which React components render, and why | React DevTools Profiler (React Native DevTools), "Highlight updates" |
| JavaScript CPU time | Hermes sampling profiler via React Native DevTools → Performance, or `.cpuprofile` capture |
| Frame drops and native thread cost | The platform tools: Perfetto/system trace on Android, Instruments on iOS (see [android.md](android.md) and [ios.md](ios.md)) |
| Startup cost breakdown | `performance.now()` marks around module require and first render; on Android, `adb shell am start -W` for the whole process |
| Bundle size and what is in it | `npx react-native bundle --platform android --dev false --sourcemap-output bundle.map` then a source-map explorer; `npx expo export` for Expo |

Instrument your own spans, and keep them in release behind a flag, so the same marks exist in the field:

```js
const start = performance.now();
const parsed = parseOrders(payload);
track('parse_orders_ms', performance.now() - start);
```

## The JavaScript thread

- **Re-renders are the default problem.** A context value recreated each render, an inline object/array/function prop, or a parent that re-renders on every keystroke will cascade. `React.memo` on the child plus `useCallback`/`useMemo` on the props, or moving the state down so the parent is not involved at all.
- **Selectors, not whole stores.** Subscribing to an entire Zustand/Redux store re-renders on every change; subscribe to the slice. With React Query/TanStack Query, `select` narrows what a component observes.
- **Never block JS.** JSON parsing of a large payload, sorting thousands of rows, crypto, image manipulation — these freeze every touch handler. Move them to the native side, a worklet, or chunk them across frames with `InteractionManager.runAfterInteractions` and batched state updates.
- **Text input and animation state** should not live in React state when they change per frame. Use `Animated` with `useNativeDriver: true`, or Reanimated shared values, so the animation runs on the UI thread and never touches JS.

## Lists

`FlatList`/`SectionList` are virtualized but still render through React. The props that matter:

| Prop | Why |
|---|---|
| `keyExtractor` | Stable keys; without them React remounts rows on any change |
| `getItemLayout` | Skips measurement, enables instant `scrollToIndex` — only valid for fixed-height rows |
| `initialNumToRender` | Keep it to what a screen actually shows; the default renders more |
| `maxToRenderPerBatch` / `updateCellsBatchingPeriod` | Trade blank space during fast scrolls against JS work per batch |
| `windowSize` | How many screens are kept mounted around the viewport |
| `removeClippedSubviews` | Detaches offscreen native views; helps on Android, test it — it has edge cases with absolute positioning |

Memoize the row component (`React.memo`) and make `renderItem` stable. If the list is long and rows are heavy, `@shopify/flash-list` recycles native views instead of mounting new ones and is usually a larger win than tuning the props above.

## Images

- Size the remote image on the server or CDN; downloading a 3000 px JPEG for a 120 px avatar costs bandwidth, decode time and memory on every row.
- `expo-image` (or `react-native-fast-image` on bare projects) adds disk/memory caching and progressive loading that the core `Image` does not.
- Set explicit `width`/`height` so layout does not reflow when the image resolves.

## Startup

- **Enable Hermes** (the default in current React Native). Hermes precompiles to bytecode, which removes JS parse time at launch.
- **Enable the New Architecture** where the project's dependencies support it: Fabric and TurboModules remove the asynchronous bridge serialization, and TurboModules load lazily instead of all at startup.
- **Audit top-level requires.** Every module imported at the entry point is evaluated at launch. Lazy-import screens through the navigator's lazy options, and defer SDK initialization until after the first screen.
- **Native side still counts.** Time to first JS frame includes the Android `Application.onCreate` and the iOS `didFinishLaunching` path; see the native references.

## Bundle and app size

- Inspect the release source map with a source-map explorer to find the heavy dependency. Moment/lodash-style full imports, duplicated polyfills and an icon font shipped whole are the usual entries.
- On Android, enable Proguard/R8 for the release variant and ship an App Bundle. On iOS, check the App Store Connect size report per device variant.
- Expo: `expo-updates` OTA payloads are downloaded by every user — size matters there too, and an update that grows the bundle grows every launch that has to apply it.

## Regression detection in CI

- Wrap a scripted journey in Detox or Maestro on a pinned device/emulator, capture the platform's frame data (see [android.md](android.md) and [ios.md](ios.md)), and compare percentiles against a baseline.
- Assert bundle size in CI: build the release bundle, read its byte size, fail past a percentage delta.
- `react-native-performance` exposes native startup marks (`nativeLaunchStart`, `runJsBundleStart/End`) as `PerformanceEntry`s, which gives a startup number you can assert on and also report from production.

## Official documentation

- React Native performance overview: https://reactnative.dev/docs/performance
- Optimizing FlatList configuration: https://reactnative.dev/docs/optimizing-flatlist-configuration
- Profiling with Hermes and React Native DevTools: https://reactnative.dev/docs/react-native-devtools
- The New Architecture: https://reactnative.dev/architecture/landing-page
- Expo performance guidance: https://docs.expo.dev/guides/analyzing-bundles/
