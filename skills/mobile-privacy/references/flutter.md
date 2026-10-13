# Privacy in Flutter

- Trace consent from its Dart state owner into each collector. Inspect Android/iOS plugin initialization: waiting until `runApp` to disable collection can be too late for a native SDK.
- Resolve SDK controls from `pubspec.lock` and native configuration. For Firebase, follow the relevant [Firebase reference](../../mobile-firebase/references/flutter.md); collection settings differ by product.
- On withdrawal or deletion, stop streams/background jobs, then clear the relevant database, files and SDK identifiers. Check work running outside the UI isolate and ensure a late result cannot repopulate the store.
- Keep deletion progress in the real account repository; show pending or retry based on the server response, not merely successful local cleanup.
- Verify widget states with the existing test tools and native startup with a device build. Check [Android](android.md) and [iOS](ios.md) declarations for the shipped plugins.

Official reference: [Flutter platform integration](https://docs.flutter.dev/platform-integration).
