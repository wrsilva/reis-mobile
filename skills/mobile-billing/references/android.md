# Billing on Android

- Read the Play Billing Library version from the version catalog or Gradle files. Version upgrades and their removed APIs are in the [Play guides](../../mobile-android/references/play.md).
- Build one `BillingClient` with a `PurchasesUpdatedListener` and pending purchases enabled through `PendingPurchasesParams`. Play Billing Library 8 adds `enableAutoServiceReconnection()`; with it enabled, do not call `startConnection()` again from `onBillingServiceDisconnected`. Without it, reconnect before the next call.
- Query products with `queryProductDetailsAsync`. A subscription purchase needs the `offerToken` of the chosen offer in `BillingFlowParams`; set `setObfuscatedAccountId` with the app account id.
- Grant only when `getPurchaseState()` is `PURCHASED` and the backend has verified the `purchaseToken`. `PENDING` purchases complete later and arrive through the listener or the next query.
- After the backend records the purchase, call `acknowledgePurchase` for non-consumables and subscriptions or `consumeAsync` for consumables. Purchases not acknowledged within three days are refunded.
- Call `queryPurchasesAsync` on startup and on resume to recover purchases completed while the app was closed or killed.
- Test with license testers and a build uploaded to a testing track with the release package name and signing key.

Official references: [integrate the library](https://developer.android.com/google/play/billing/integrate), [test billing](https://developer.android.com/google/play/billing/test).
