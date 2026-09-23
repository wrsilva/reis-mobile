# Observability in React Native and Expo

A React Native app fails in two runtimes. A **JavaScript error** produces a red screen in development and, in production, either a caught error boundary or a fatal that the native crash reporter never sees on its own. A **native crash** produces a normal Android/iOS crash with no JavaScript stack. A setup that covers only one of them explains half the incidents — and the half it misses is usually the harder one.

## Cover both runtimes

Use a reporter with a React Native SDK (`@sentry/react-native`, Bugsnag, Crashlytics via `@react-native-firebase/crashlytics`, Embrace). What to check in the configuration:

- **JavaScript fatals are reported as fatals**, not swallowed by a global handler that logs and continues. `ErrorUtils.setGlobalHandler` is the underlying mechanism; the SDK wraps it, and an app that installs its own handler afterwards silently disables reporting.
- **Unhandled promise rejections** are captured. In Hermes they do not reach the global error handler by default, and an SDK option or a rejection tracker is needed.
- **Native crashes** are captured by the SDK's Android and iOS layers — which means the native install steps (autolinking plus any Gradle/Podfile lines the SDK documents) must actually be present. Verify on a release build, not in Metro.
- **React error boundaries** report and then render a fallback. A boundary that catches and shows a blank screen without reporting is the most common invisible failure in RN apps.

## Source maps are the whole game

A production JavaScript stack trace is minified Hermes bytecode offsets. Without source maps uploaded per build, every report is unreadable:

```bash
# The release build emits the bundle and its map; upload both, per platform, per version.
npx react-native bundle --platform android --dev false \
  --entry-file index.js \
  --bundle-output android/app/build/generated/.../index.android.bundle \
  --sourcemap-output index.android.bundle.map
```

- The SDK's Gradle plugin / Xcode build phase usually automates the upload; confirm it ran for the shipped variant, and that the **release identifier** (version + build number + bundle hash) matches what the app reports at runtime. A mismatched release is the usual reason a correctly uploaded map still does not symbolicate.
- **Expo:** `eas build` uploads source maps when the SDK's config plugin is installed; **`eas update` publishes a new bundle without a new build**, so each OTA update needs its own source map upload and its own release identifier. An OTA-heavy app with build-time-only uploads has unreadable traces for every update after the first.
- Android also needs the R8 mapping file and iOS the dSYMs for native frames. Three artifacts, as in every cross-platform stack.

## OTA updates change what "app version" means

With `expo-updates` or CodePush, the native build and the JavaScript bundle version independently. Every signal must carry **both** — the native version/build and the update/bundle id — or you cannot tell which JavaScript is actually running on a device reporting a crash. Set the update id as a custom key at startup and include it in the release identifier used for source maps.

This is the single most important RN-specific item in the skill's §4 segmentation list.

## Context and breadcrumbs

- **Navigation:** React Navigation's `onStateChange`, or Expo Router's equivalent, produces a screen breadcrumb per transition. Most SDKs ship an integration that does it for you.
- **Network:** wrap `fetch`/`axios` once to generate the request id, add the `X-Request-Id` header, and record method, host, status and duration. SDK network breadcrumbs are on by default in some vendors and capture full URLs — review and restrict that before shipping, since query strings carry tokens.
- **Custom keys:** screen, auth state, flag values, update id, connectivity class from NetInfo, outbox depth.
- **Redux/Zustand/TanStack Query:** an action or query-error middleware that forwards failures with the state slice that caused them. Beware the vendor Redux integrations that attach the **entire state tree** to every event — that is both a cost and a privacy problem.

## Performance and native field data

- The RN SDKs report app-start, slow/frozen frames and, in newer versions, some JS-thread metrics. Treat them as indicators and read the platform's own data as the truth.
- Android vitals and Play Console ANR data, Xcode Organizer and MetricKit all still apply and still see the real process — see [android.md](android.md) and [ios.md](ios.md). An ANR in a React Native app is an Android ANR, reported by Play, and invisible from JavaScript.
- The lab counterparts are in [mobile-performance/references/react-native.md](../../mobile-performance/references/react-native.md).

## Privacy and consent

- The Play Data safety form and the iOS privacy nutrition label plus `PrivacyInfo.xcprivacy` must cover the native SDKs the JS packages pull in. Expo config plugins add native SDKs you never wrote a line against.
- Gate initialization on consent; most SDKs support initializing with sending disabled and enabling it later.
- Implement `beforeSend` (or the vendor's equivalent) to strip tokens, bodies and query strings, and unit-test it — it is plain JavaScript, so this is a cheap test with real value.
- `console.log` left in production ships strings into the device log and, with some SDK configurations, into breadcrumbs. Strip logs in release (`babel-plugin-transform-remove-console` or equivalent) or make the logger deliberate.

## Official documentation

- React Native source maps and symbolication: https://reactnative.dev/docs/symbolication
- Expo EAS Update: https://docs.expo.dev/eas-update/introduction/
- React Native Firebase Crashlytics: https://rnfirebase.io/crashlytics/usage
- Sentry for React Native: https://docs.sentry.io/platforms/react-native/
- NetInfo: https://github.com/react-native-netinfo/react-native-netinfo
