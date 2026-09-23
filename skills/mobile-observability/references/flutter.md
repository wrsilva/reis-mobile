# Observability in Flutter

Flutter's specific problem is that a failure can happen in three places with three different capture mechanisms: **Dart** (uncaught exceptions in the framework, in your code, or in an isolate), the **Flutter engine/native layer** (a real native crash), and the **platform channels** between them. A setup that only wires `FlutterError.onError` misses two of the three.

## Capture all three layers

```dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // 1. Errors the Flutter framework catches (build, layout, paint, gestures).
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;

  // 2. Errors from the Dart zone that the framework does not catch:
  //    async gaps, futures without a catch, platform-channel replies.
  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };

  runApp(const App());
}
```

- `FlutterError.onError` alone leaves every unhandled async error unreported.
- A background `Isolate` has its own error handling: add an `Isolate.current.addErrorListener` (or the reporter's helper) inside the isolate entry point, or its crashes are silent.
- Native crashes in the engine or in a plugin's Android/iOS code are captured by the native SDK the Flutter package installs — which is why the plugin's native setup steps matter, not just the Dart ones.

Sentry, Bugsnag, Embrace and Crashlytics all follow this shape; the reference for the Firebase path is [mobile-firebase](../../mobile-firebase/SKILL.md).

## Symbols

A release Flutter build is AOT-compiled, and its Dart stack traces are **obfuscated addresses** unless the debug info is uploaded.

```bash
flutter build appbundle --obfuscate --split-debug-info=build/symbols
flutter build ipa       --obfuscate --split-debug-info=build/symbols
```

Then upload `build/symbols` with the vendor's command (`firebase crashlytics:symbols:upload`, `sentry-cli debug-files upload`, …) **for every build you ship**, and keep the directory per version — symbols from a different build do not resolve. On Android you still need the R8 mapping file for the Kotlin side, and on iOS the dSYMs for the native side: three uploads, not one.

The most common production gap in Flutter apps is exactly this: Dart symbols uploaded during a manual first setup, never wired into CI, and unreadable stack traces from then on. Verify by crashing a release build on purpose once.

## Context and breadcrumbs

- **Navigation breadcrumbs** come free from a `NavigatorObserver`:

```dart
class ObservabilityObserver extends NavigatorObserver {
  @override
  void didPush(Route route, Route? previous) =>
      reporter.breadcrumb('screen_view', {'name': route.settings.name ?? 'unnamed'});
}
```

Route names must be set for this to be useful — an app built entirely from anonymous `MaterialPageRoute`s produces `unnamed` breadcrumbs.

- **Custom keys** per session: `setCustomKey` for the screen, auth state, flag values, outbox depth, connectivity.
- **Network breadcrumbs** belong in a Dio `Interceptor` or an `http` `BaseClient` wrapper, where the request id is also generated and attached. Record method, host, status and duration — never the full URL or the body.
- **State-management errors:** `Bloc.observer` (`onError`), Riverpod's `ProviderObserver`, or the equivalent hook forwards state-layer failures with the state that caused them, which a bare stack trace does not carry.
- Keep the cause chain: `Error.throwWithStackTrace(AppException(e), stack)` preserves the original trace, while `throw AppException('failed')` in a `catch` discards the only useful part of the report.

## Performance signals

- **Firebase Performance Monitoring** for Flutter gives app-start and custom traces; HTTP traces are collected automatically on the native side, and Dart-side calls need explicit `HttpMetric` instrumentation.
- The lab counterparts — frame timings, startup traces, `integration_test` timeline summaries — are in [mobile-performance/references/flutter.md](../../mobile-performance/references/flutter.md). Use the same metric names in both so a CI regression and a field regression are comparable.
- `SchedulerBinding.instance.addTimingsCallback` exposes real frame timings in a release build; sampled and aggregated, it is a usable field jank metric when a vendor SDK does not provide one.

## Platform field data still applies

Flutter does not replace Android vitals, Play Console ANR data, Xcode Organizer or MetricKit — the app is still an Android and an iOS process. ANRs and watchdog terminations in a Flutter app show up there and nowhere in the Dart layer. Read [android.md](android.md) and [ios.md](ios.md) alongside this file.

## Privacy and consent

- Both stores' declarations (Data safety, privacy nutrition label and `PrivacyInfo.xcprivacy`) must cover what the Flutter plugins collect natively, not just what your Dart code sends.
- Gate collection: `FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(false)` until consent, or the vendor's equivalent, set **before** the reporter would send anything.
- Implement the SDK's redaction hook (`beforeSend` in Sentry, a record filter elsewhere) and unit-test it with a payload containing a token.

## Official documentation

- Handling errors in Flutter: https://docs.flutter.dev/testing/errors
- Obfuscating Dart code: https://docs.flutter.dev/deployment/obfuscate
- Crashlytics for Flutter: https://firebase.google.com/docs/crashlytics/get-started?platform=flutter
- Firebase Performance Monitoring for Flutter: https://firebase.google.com/docs/perf-mon/flutter/get-started
- Flutter DevTools: https://docs.flutter.dev/tools/devtools/overview
