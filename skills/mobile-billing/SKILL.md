---
name: mobile-billing
description: Implements and reviews in-app purchases and subscriptions across Flutter, Android, iOS, React Native and Kotlin Multiplatform. Use for product catalogs, purchase and restore flows, pending or interrupted purchases, server-side verification, acknowledgement, account binding, plan changes and store sandbox tests. Store submission belongs to mobile-release; account deletion to mobile-privacy.
intents: [billing]
stacks: ["*"]
---

# Mobile Billing

Trace each purchase from the product query to the entitlement your backend records. Reuse the [project brief](../../docs/agent-context.md), then inspect the billing client setup, the purchase listener, the backend verification endpoint and every screen that reads entitlement before changing a flow. The store-side lifecycle (subscription states, server notifications, acknowledgement deadlines, sandbox tools) is in the [billing lifecycle reference](../mobile-release/references/billing.md); this skill applies it to the app's code.

## Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Android | [references/android.md](references/android.md) |
| iOS | [references/ios.md](references/ios.md) |
| React Native / Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |

Flutter and React Native apps also need the Android and iOS references for store configuration and native behavior. Confirm the billing library version from the lock file; client APIs change across major versions.

## Build the purchase inventory

Record for each product: store product id, type (consumable, non-consumable, auto-renewable or non-renewing subscription), base plans and offers or subscription group, the call that starts the purchase, the listener that receives results, the backend endpoint that verifies, the code that reads entitlement and the acknowledge, consume or finish call. Mark store console and backend evidence you cannot read as unknown.

## The purchase is a state machine

- Register the purchase listener at startup, before any purchase UI, for the life of the process. Results arrive outside the paywall: renewals, deferred payments, Ask to Buy approvals, purchases from another device and purchases interrupted by process death.
- Model idle, purchasing, pending, verifying, granted, failed and cancelled. A user cancellation is a normal outcome: no error dialog and no retry.
- A pending purchase grants nothing. Show it as pending and grant only after the store reports the payment completed.
- Send the purchase token or signed transaction to the backend with the app account id. The backend verifies it with the store and records the entitlement idempotently, keyed by the store's purchase identifier (`purchaseToken` on Google Play, `transactionId` and `originalTransactionId` on the App Store), so a purchase delivered again by the listener, a restore or the next launch grants once.
- Acknowledge, consume or finish only after the backend confirms the record. On the next launch, query unfinished or unacknowledged purchases and resume verification; this is the recovery path for a crash between payment and record.
- Bind the purchase to the account that started it with the store's account field (`obfuscatedAccountId` on Google Play, `appAccountToken` on the App Store). A result that arrives after sign-out or an account switch is reconciled by the backend, never attached to whoever is signed in now.

## Entitlement and catalog

- Screens read entitlement from the backend. Cache the last known state for offline use with its timestamp, and decide explicitly what an expired cache allows.
- Display prices, currencies and offers only from the store's product details. Handle products missing from the current storefront.
- Upgrades, downgrades and plan changes follow each store's rules (replacement modes on Google Play, subscription group levels on the App Store). The backend links the replaced purchase to the new one.
- Provide restore: a visible restore action on iOS and a purchase query on launch and resume on Android. Refunds and revocations arrive through server notifications; the app shows the backend state and does not revoke on its own.

## Failure scenarios to test

Purchase interrupted by process death; verification failing on a network error and retried with the same token; the same purchase delivered twice; a pending purchase completed days later while the app is closed; user cancellation; a product id not found; an account switch during a purchase; a refund notification; access kept during a grace period or billing retry; restore on a fresh install.

## Verify and deliver

Use each store's sandbox: Google Play license testers on a testing track, StoreKit configuration files in Xcode and Sandbox accounts. Test the backend by replaying server notification payloads. Unit-test the purchase state machine against a fake billing client.

Return the purchase inventory with `path:symbol` evidence, the implemented transitions, test results and any unverified store console or backend configuration. Whether digital goods must use store billing depends on the market and changes often: check the current store policy instead of designing from memory. Use [mobile-release](../mobile-release/SKILL.md) for submission, [mobile-privacy](../mobile-privacy/SKILL.md) for account deletion versus cancellation, [mobile-security](../mobile-security/SKILL.md) for tampered clients and [mobile-analytics](../mobile-analytics/SKILL.md) for conversion events.

## Official sources

- [Google Play Billing integration](https://developer.android.com/google/play/billing/integrate)
- [StoreKit in-app purchase](https://developer.apple.com/documentation/storekit/in-app-purchase)
- [App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications)
