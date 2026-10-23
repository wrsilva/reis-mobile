# Billing in Flutter

- Confirm the plugin in `pubspec.lock`: `in_app_purchase` with its Android and StoreKit implementations, or a vendor SDK. Read that version's documentation; the APIs below are from `in_app_purchase`.
- Listen to `InAppPurchase.instance.purchaseStream` from an app-level owner created at startup, not from the paywall widget. Cancel that `StreamSubscription` only when the owner is disposed.
- Check `isAvailable()` before `queryProductDetails()`, and handle the ids returned in `notFoundIDs`.
- Handle every `PurchaseStatus`: `pending`, `purchased`, `restored`, `error` and `canceled`. Send `verificationData.serverVerificationData` to the backend for purchased and restored items, then call `completePurchase` when `pendingCompletePurchase` is true.
- For consumables, pass `autoConsume: false` to `buyConsumable`: the default consumes the product right after a successful purchase, without waiting for your backend. On Android, consume after the backend records the purchase through `InAppPurchaseAndroidPlatformAddition.consumePurchase`.
- Pass the account identifier through `PurchaseParam.applicationUserName`, and confirm how the installed platform implementation forwards it to each store.
- Put the plugin behind an app interface so unit and widget tests can drive every purchase status with a fake stream. Store behavior needs device builds against the sandboxes in [Android](android.md) and [iOS](ios.md).

Official reference: [in_app_purchase](https://pub.dev/packages/in_app_purchase).
