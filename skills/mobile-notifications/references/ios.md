# Notifications on iOS

- Inspect authorization/settings, remote registration, entitlements and the APNs environment of the signed build. Device token registration and user authorization to display notifications are distinct.
- Route foreground presentation and tap/actions through the existing `UNUserNotificationCenter` delegate. Coordinate the cold-start payload with scene/session/router readiness.
- Re-register/reconcile tokens as the platform/provider prescribes; do not assume a cached APNs/FCM token stays valid. Keep APNs and FCM token types distinct on the backend.
- Rich media may require a Notification Service Extension. Check extension entitlements, time limits and fallback content; avoid exposing protected content in notification previews.
- Silent pushes are opportunistic. Do not implement a required periodic job or entitlement update solely through their delivery.
- Local notifications use stable request identifiers and explicit calendar/timezone semantics. Verify edits, cancellation and displayed-item cleanup separately from pending schedules.
- Test with an appropriately configured simulator/device for the installed OS/provider; report the actual environment instead of claiming all simulator or all device states behave alike.

Official reference: [User Notifications](https://developer.apple.com/documentation/usernotifications). For FCM-specific integration, use [iOS messaging](../../mobile-firebase/references/ios/messaging.md).
