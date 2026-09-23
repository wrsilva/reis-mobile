# In-app purchases and subscription lifecycle

Applies to every stack. Billing bugs are expensive in a way other mobile bugs are not: a user who paid and did not receive the entitlement files a store complaint, a chargeback, and a one-star review, and the store holds *you* responsible for the reconciliation. The design that avoids this is the same on both platforms.

## The rule everything follows from

**The client never decides entitlement.** The app's job is to start a purchase and to hand the resulting receipt/token to your backend. The backend verifies it with the store's server, records the entitlement, and answers "what does this user own?". Every screen reads that answer.

An app that grants a feature because a local purchase callback returned success can be defeated with a patched binary, and — more commonly — simply gets it wrong: the callback is missed because the app was killed mid-purchase, or the subscription was cancelled from the store's settings and the app never hears about it.

```
app ──buy──▶ store ──token/receipt──▶ app ──▶ your backend ──verify──▶ store server
                                                   │
 app ◀────── entitlement state ─────────────────────┘
                                   ▲
 store server ──server notifications──┘   (renewals, cancellations, refunds, billing retries)
```

## Server notifications are not optional

The purchase callback covers the moment of purchase. Everything afterwards — a renewal at 3am, a cancellation, a refund, a failed payment entering a retry window, an upgrade, a family-sharing change — happens with the app closed and reaches you only through the store's server-to-server notifications:

- **Google Play:** Real-time developer notifications (Pub/Sub), plus the Google Play Developer API for the authoritative subscription state.
- **Apple:** App Store Server Notifications V2, plus the App Store Server API and signed transactions.

Without them, a cancelled subscription keeps working until the app next happens to check, and a refunded purchase is never revoked. "We poll on app launch" is not equivalent: the user who cancelled may not open the app for weeks, and a refunded purchase must be revoked immediately.

## The states to model

A subscription is not a boolean. At minimum, entitlement must distinguish:

| State | Behaviour |
|---|---|
| Active | Full access |
| Active, cancelled (will not renew) | Full access until the period ends; a good place to ask why |
| In a billing retry / grace period | **Keep access** and prompt the user to fix payment — revoking here loses users who would have paid |
| On hold / suspended | Access revoked, recoverable if payment succeeds |
| Paused (Android) | Access revoked, scheduled to resume |
| Expired | No access |
| Refunded / revoked | Access removed immediately, on the notification |
| Trial / introductory offer | Active, but the eligibility rules differ and are per-account, not per-device |

Treating anything other than "active" as "no access" is the standard way to break grace periods and lose revenue.

## Purchase acknowledgement

Both stores require the purchase to be consumed or acknowledged, and both **refund automatically** if you do not.

- **Google Play:** a purchase not acknowledged (or consumed, for consumables) within three days is automatically refunded and revoked. Acknowledge only **after** your backend has recorded the entitlement, so a failure to record cannot produce a user who paid and owns nothing.
- **Apple:** a transaction that is not finished is re-delivered on every launch. Finish it only after the entitlement is recorded — the re-delivery is the recovery mechanism, and finishing early discards it.

The crash-in-the-middle case is the one to test: purchase succeeds, the app is killed before the backend call. On the next launch, the pending purchase must still be visible, sent, recorded and only then acknowledged.

## Restore and multi-device

- A **restore** path is mandatory on iOS (App Review rejects apps without one for non-consumables and subscriptions) and expected everywhere. It must be reachable without being logged in to *your* account if the purchase is tied to the store account.
- Entitlement follows the **store account**, but your product follows **your** user account. Decide explicitly what happens when they disagree: one store account buying for two of your users, or one of your users signing in on a device with a different store account. This is where fraud and support tickets concentrate; the backend must own the mapping, and it must be enforced there.
- Prices, currencies and availability come from the store per region. Never hard-code a price string; read it from the product query and display the localized formatted price the store returns.

## Testing

- **Google Play:** licence testers with test payment methods, internal testing track, and shortened subscription periods for renewal testing. Purchases must come from a build uploaded to a track with the same package name and signing key.
- **Apple:** StoreKit Testing in Xcode (a local `.storekit` configuration file, with time acceleration and error injection — the only practical way to test renewals, billing retry and refunds) and Sandbox accounts for the end-to-end path with real server notifications.
- Test on the backend, not only in the app: replay a server notification payload and assert the entitlement change. That is the code that actually decides access.
- Cases worth a test each: purchase interrupted by process death; a refund notification; a cancellation followed by a resubscribe; a user who already owns the product buying again; an expired subscription that renews after a grace period.

## Per-stack notes

| Stack | Client library |
|---|---|
| Native Android | Google Play Billing Library — the deep migration and version material is in [`mobile-android/references/play.md`](../../mobile-android/references/play.md) |
| Native iOS | StoreKit 2 (`Product`, `Transaction`, `Transaction.updates`, `Transaction.currentEntitlements`) — the `Transaction.updates` listener must be started at launch, or transactions completed outside the app are missed |
| Flutter | `in_app_purchase` (federated, both stores) or a vendor SDK; the purchase stream must be subscribed before the first purchase and on every launch |
| React Native / Expo | `react-native-iap`, `expo-in-app-purchases` where available, or a vendor SDK; Expo managed projects need a development build — in-app purchases do not work in Expo Go |
| Kotlin Multiplatform | Billing is host-specific. Keep the entitlement *model* and the backend calls in `commonMain`, and the store client in each host |

A subscription infrastructure vendor (RevenueCat, Adapty and similar) exists precisely because the server-side half above is substantial. Using one is a legitimate decision; it does not remove the need to decide entitlement on a server rather than in the app — it moves that server.

## Store policy

Both stores require that digital content consumed in the app is sold through their billing system, with a narrow and changing set of exceptions that vary by region and by court ruling. Alternative payment links have specific, enforced requirements. Before designing anything that bypasses store billing, read the current policy for the target markets — this is the most volatile area of store policy and the most expensive one to get wrong, since the penalty is removal.

Release-time checks for the store submission itself are in [readiness.md](readiness.md).

## Official documentation

- Google Play Billing: https://developer.android.com/google/play/billing
- Real-time developer notifications: https://developer.android.com/google/play/billing/getting-ready#configure-rtdn
- Google Play Developer API, subscriptions: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2
- StoreKit: https://developer.apple.com/documentation/storekit
- App Store Server Notifications V2: https://developer.apple.com/documentation/appstoreservernotifications
- Testing in-app purchases with StoreKit Test: https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode
