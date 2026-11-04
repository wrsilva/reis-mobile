# Hardware in Flutter

- Confirm the plugins in `pubspec.lock` (for example `camera`, `mobile_scanner`, `geolocator`, `sensors_plus`, a BLE or NFC plugin, `permission_handler`) and read each one's platform setup. Each plugin needs its Android permissions and iOS usage strings; a missing iOS usage description crashes the app when the API is used.
- The `camera` plugin does not manage the app lifecycle: dispose the `CameraController` when the app becomes inactive and create it again on resume, from `didChangeAppLifecycleState` or an `AppLifecycleListener`.
- Cancel every sensor, location and scan `StreamSubscription` and dispose every controller in `dispose()`. A stream left open keeps the hardware and the battery busy after the screen is gone.
- Keep per-frame image processing out of the UI isolate: use the plugin's native analysis, a background isolate, or native code.
- When no maintained plugin covers the capability, write the bridge with platform channels or Pigeon using the [native interop guides](../../mobile-flutter/references/native.md).
- Hide the plugin behind an app interface to unit-test the state machine with a fake, and verify behavior on devices with the [Android](android.md) and [iOS](ios.md) references.

Official references: [camera](https://pub.dev/packages/camera), [platform channels](https://docs.flutter.dev/platform-integration/platform-channels).
