# Hardware on iOS

- Add the usage description for every capability used: `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSBluetoothAlwaysUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `NFCReaderUsageDescription` and `NSMotionUsageDescription`. The general permission flow is in the [platform guide](../../mobile-ios/references/platform-features.md).
- Camera: `AVCaptureSession.startRunning()` blocks until the session starts, so call it on a dedicated serial queue, not the main thread. Observe `AVCaptureSession.wasInterruptedNotification` and resume when the interruption ends. For barcode and text scanning, `DataScannerViewController` (iOS 16 and later) requires checking `isSupported` and `isAvailable`.
- Location: request When In Use first, read `authorizationStatus` and `accuracyAuthorization` (reduced accuracy is a valid grant), and use `CLLocationUpdate.liveUpdates()` on iOS 17 and later or the delegate API before it. Background updates need the `location` background mode and `allowsBackgroundLocationUpdates`.
- Bluetooth: wait for `CBCentralManager` to report `.poweredOn` before scanning. Background use needs the `bluetooth-central` mode, scans that name service UUIDs and state restoration through `CBCentralManagerOptionRestoreIdentifierKey`.
- NFC: Core NFC needs the NFC tag reading capability and a check of `readingAvailable` before starting a reader session.
- Motion: share one `CMMotionManager` for the app and stop updates when the feature is not visible. Haptics: check `CHHapticEngine.capabilitiesForHardware()` before custom patterns.
- The Simulator has no camera, Bluetooth or NFC; simulate location with GPX files and test the rest on devices.

Official references: [AVCaptureSession](https://developer.apple.com/documentation/avfoundation/avcapturesession), [DataScannerViewController](https://developer.apple.com/documentation/visionkit/datascannerviewcontroller), [Core NFC](https://developer.apple.com/documentation/corenfc).
