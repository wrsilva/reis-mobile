# Billing on iOS

- Use StoreKit 2 unless the deployment target or an existing integration requires the original API. The basic purchase call is in the [StoreKit section](../../mobile-ios/references/platform-features.md).
- Start a long-lived task over `Transaction.updates` at launch, before any purchase UI. It delivers renewals, Ask to Buy approvals, refunds and purchases made on other devices.
- Purchase with `product.purchase(options:)` including `.appAccountToken(_:)` set to the account's UUID. Handle `.success`, `.pending` and `.userCancelled`; grant only a `.verified` transaction.
- Send the signed transaction (`jwsRepresentation`) to the backend and call `transaction.finish()` after the backend records it. Iterate `Transaction.unfinished` at launch to resume interrupted verifications.
- Read `Transaction.currentEntitlements` and the subscription `status` to display state, but let the backend decide access. Distinguish `inGracePeriod` and `inBillingRetryPeriod` from `expired` and `revoked`.
- Offer restore through `AppStore.sync()` behind an explicit user action; it can prompt for the Apple Account.
- Test with a StoreKit configuration file in the scheme, then Sandbox and TestFlight.

Official references: [In-App Purchase](https://developer.apple.com/documentation/storekit/in-app-purchase), [StoreKit testing in Xcode](https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode).
