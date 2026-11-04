# Billing in Kotlin Multiplatform

- Keep product ids, the purchase state machine, the entitlement model and backend verification calls in `commonMain` when the project shares that logic. Keep `BillingClient` in Android code and StoreKit in the iOS app.
- StoreKit 2 is a Swift-only API, so Kotlin/Native cannot call it through Objective-C interop. Implement the iOS store client in Swift and inject it into shared code through an interface the shared module exports.
- Define one shared result type for purchased, pending, cancelled and failed, and map each host's results into it without losing the store purchase identifier.
- Start each host's listener at app launch and forward results to the shared owner. Each host keeps its own acknowledge or finish call, made after the backend confirms the record.
- Test the shared state machine in `commonTest` with a fake store client. Test each host against its store sandbox separately; an Android pass does not prove StoreKit behavior.

Official references: [platform-specific declarations](https://kotlinlang.org/docs/multiplatform/multiplatform-expect-actual.html), [Swift and Objective-C interop](https://kotlinlang.org/docs/native-objc-interop.html).
