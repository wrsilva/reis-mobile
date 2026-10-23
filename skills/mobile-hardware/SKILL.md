---
name: mobile-hardware
description: Integrates and reviews device hardware features across Flutter, Android, iOS, React Native and Kotlin Multiplatform, such as camera and microphone capture, Bluetooth and BLE, NFC, location and geofencing, motion sensors, barcode and QR scanning, and haptics. Covers capability checks, runtime permissions, lifecycle and background limits, battery cost and real-device testing. Biometric sign-in belongs to mobile-auth.
intents: [hardware]
stacks: ["*"]
---

# Mobile Hardware

Hardware is optional, shared, revocable and slow. Trace each capability from its availability check to the release of the resource. Reuse the [project brief](../../docs/agent-context.md), then inspect the library or platform API in use, the declared permissions and usage strings, the screens that acquire the resource and any background work before changing a flow.

## Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Android | [references/android.md](references/android.md) |
| iOS | [references/ios.md](references/ios.md) |
| React Native / Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |

Flutter and React Native apps also need the Android and iOS references for permissions, declarations and native behavior. Confirm plugin and library versions from the lock file.

## Build the capability inventory

Record for each capability: the API or library, declared permissions and usage strings, the store-facing feature declaration, where it is acquired and released, whether it runs in the background, its battery cost and the fallback when it is missing or denied. On Android, declare optional hardware with `<uses-feature android:required="false">` so the app stays installable without it. On iOS, list a device capability as required only when the app cannot work at all without it, because the App Store then hides the app from devices that lack it.

## Availability, state and permission

- Check three things separately: the hardware exists, it is turned on (Bluetooth enabled, location services on, NFC enabled) and the app has permission. Each has its own message and recovery path.
- Ask for permission in context, when the user starts the feature, and handle denied, permanently denied or restricted, and reduced grants such as approximate location.
- Background location is a separate, later request with its own justification, and both stores review it closely. Request foreground access first.
- Denial or revocation disables only the feature that needs the hardware. Android ends the app's process when the user revokes a permission in Settings, so restore state on the next launch.
- The data captured through hardware, such as photos, audio and location, follows [mobile-privacy](../mobile-privacy/SKILL.md).

## Lifecycle and concurrency

- Acquire capture sessions, scans, sensor listeners and location updates when the feature becomes visible, and release them when it leaves the foreground. Another app or the system can take the camera or microphone; handle the interruption and resume.
- Configuration changes, navigation and process death must not leak a session or leave a listener registered.
- BLE is a connection state machine: scanning, connecting, discovering services, ready and disconnected, each with a timeout. Run one GATT operation at a time, reconnect with backoff and treat vendor and firmware differences as expected input.
- Process frames and sensor samples off the main thread with backpressure: keep the latest frame and drop the rest instead of queueing.

## Battery and background

Scans and location updates are the expensive part. Use the lowest accuracy and frequency that serve the feature and stop when it is done. Ongoing work in the background needs the platform's mechanism: a foreground service of the right type on Android, a declared background mode on iOS. See [background execution](../mobile-performance/references/background.md) for the budget.

## Verify and deliver

Simulators and emulators do not reproduce most hardware: the iOS Simulator has no camera, Bluetooth or NFC. Unit-test the state machine against a fake hardware interface, then test on real devices for each OS version and vendor that matters. Cover denial, revocation while running, hardware turned off, interruption, background and foreground transitions, and a missing capability.

Return the capability inventory with `path:symbol` evidence, the permission and declaration changes, the implemented states, the device test matrix with results and any device or OS version not tested.

## Official sources

- [Android runtime permissions](https://developer.android.com/training/permissions/requesting)
- [Android Bluetooth Low Energy](https://developer.android.com/develop/connectivity/bluetooth/ble/ble-overview)
- [Core Bluetooth](https://developer.apple.com/documentation/corebluetooth)
- [Core Location](https://developer.apple.com/documentation/corelocation)
