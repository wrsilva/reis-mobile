# Hardware on Android

- Declare optional hardware with `<uses-feature android:required="false">` and check it at runtime with `PackageManager.hasSystemFeature`. Inspect the merged manifest for permissions added by libraries.
- Request permissions with `ActivityResultContracts.RequestPermission` or `RequestMultiplePermissions`, and use `shouldShowRequestPermissionRationale` to explain before asking again. On Android 12 and later, Bluetooth needs `BLUETOOTH_SCAN` (with `neverForLocation` when scans do not derive location) and `BLUETOOTH_CONNECT`, and the user can grant approximate location only.
- Camera: bind CameraX use cases to a lifecycle with `bindToLifecycle`, and use `ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST` for frame analysis. Camera guides, including Camera2 migrations, are in the [media guides](../../mobile-android/references/media.md).
- Location: use `FusedLocationProviderClient` with the lowest `Priority` that serves the feature, and `GeofencingClient` for geofences. `ACCESS_BACKGROUND_LOCATION` is a separate request and needs a Play Console declaration.
- BLE: serialize GATT operations, apply timeouts and call `BluetoothGatt.close()` when done so clients are not leaked. Prefer `CompanionDeviceManager` pairing when the app talks to a known device type.
- NFC: enable reader mode or foreground dispatch on `NfcAdapter` while the activity is resumed and disable it when paused.
- Ongoing background capture, location or device connections need a foreground service with the matching type (`camera`, `microphone`, `location`, `connectedDevice`).
- Test location and sensors with the emulator's extended controls, and BLE, NFC and camera behavior on physical devices from the vendors that matter.

Official references: [location](https://developer.android.com/develop/sensors-and-location/location), [CameraX](https://developer.android.com/media/camera/camerax), [foreground service types](https://developer.android.com/develop/background-work/services/fgs/service-types), [companion device pairing](https://developer.android.com/develop/connectivity/bluetooth/companion-device-pairing).
