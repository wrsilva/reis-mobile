# Notifications in Kotlin Multiplatform

- Share payload validation, account binding requests and pending-destination models where appropriate. Android services/channels and iOS delegates/entitlements remain host responsibilities.
- Expose typed notification and tap events across the boundary; receiving a native callback before shared initialization must not silently drop a requested destination.
- Coordinate deduplication and account generation centrally when both host and shared handlers can observe one event. Persist only what is needed, with expiry and account ownership.
- Keep remote tokens tagged with platform and provider; do not treat them as interchangeable strings in server registration.
- Test shared validation, dedup and wrong-account cases in `commonTest`; verify registration/display/tap behavior in each host using [Android](android.md) and [iOS](ios.md).

Official references: [Kotlin platform-specific declarations](https://kotlinlang.org/docs/multiplatform/multiplatform-expect-actual.html), [FCM token management](https://firebase.google.com/docs/cloud-messaging/manage-tokens).
