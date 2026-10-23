# Hardware in Kotlin Multiplatform

- Hardware access is host code. Keep a capability interface in `commonMain` (a location source, a BLE transport, a scanner) and implement it in `androidMain` and `iosMain` with platform APIs, or in Swift in the iOS app when the API is easier to use from Swift.
- Permissions, usage strings and manifest declarations belong to each host. Shared code receives the granted, denied or unavailable state; it does not request permissions.
- Wrap listener and delegate APIs with `callbackFlow` and unregister in `awaitClose`, so cancelling the collector releases the hardware.
- Apple delegate properties are weak. Keep a strong reference to the delegate object for as long as the manager should report, or callbacks stop silently.
- Test shared state transitions in `commonTest` with a fake capability. Test each host on devices separately; an Android pass does not prove Core Location or Core Bluetooth behavior.

Official references: [callbackFlow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/callback-flow.html), [Swift and Objective-C interop](https://kotlinlang.org/docs/native-objc-interop.html). Apply the [Android](android.md) and [iOS](ios.md) references to host code.
