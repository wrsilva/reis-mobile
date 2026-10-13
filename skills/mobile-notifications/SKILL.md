---
name: mobile-notifications
description: Implements and reviews push and local notification lifecycles across Flutter, Android, iOS, React Native and Kotlin Multiplatform. Use for FCM/APNs or Expo delivery, token rotation, notification permissions and channels, account bindings, duplicate messages and cold-start tap navigation. Git push and observability alerts are outside this skill.
intents: [notifications]
stacks: ["*"]
---

# Mobile Notifications

Use the [project brief](../../docs/agent-context.md) to locate registration, backend token binding, payload schema, handlers, local scheduling and navigation. Determine the installed provider and platform versions; preserve the requested audit/implementation scope. Local notifications, remote transport and product notification preferences are separate concerns.

## Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Android | [references/android.md](references/android.md) |
| iOS | [references/ios.md](references/ios.md) |
| React Native / Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |

## Own registration and permission state

- Model authorization, token availability, server binding and product preferences independently. Permission granted or provider acceptance does not prove delivery/display.
- Ask at a useful point, handle denial without a prompt loop, and refresh actual settings after returning from system Settings. Respect platform channel/category behavior and user choices.
- Treat tokens as rotating installation endpoints, not user identities. Upsert the current token and platform/environment with the authenticated backend, handle rotation, and remove invalid endpoints using provider feedback.
- Define logout/account-switch behavior: detach the old user binding and prevent delayed registration from rebinding it. If offline, record an unconfirmed detach and reconcile; local logout cannot instantly remove a server binding.
- Minimize sensitive payload content, especially on the lock screen. Fetch protected content under current authorization; never include credentials in payloads or logs.

## Handle lifecycle and duplicates

- Write a matrix for foreground, background, terminated launch and tap/action entrypoints. Separate receiving/displaying from routing. Avoid showing a local copy when the OS/provider already displayed the message.
- Give messages/actions stable identifiers where the contract supports them. Deduplicate deliveries and repeated taps within the appropriate account and expiry scope; do not suppress a distinct event with the same title.
- On cold start, validate the destination and wait for session restoration plus navigation readiness. Resolve authorization before accessing the resource. Keep a pending destination through required login, with expiry and account checks; reject stale/wrong-account payloads.
- A notification is a hint, not the source of truth for a payment, entitlement or database mutation. Silent delivery is not guaranteed background execution. Reconcile on foreground using the backend.
- For local schedules, define identifiers, timezone/calendar semantics, update/cancel behavior and persistence. Account deletion/logout must remove account-scoped pending and displayed items where appropriate. Confirm scheduling limits and exact-alarm requirements against the actual platform/version.

## Verify and deliver

Test denied permission, settings changes, token rotation, offline binding, account switch during registration, duplicate messages/taps, expired destinations, cold start requiring login and local schedule changes. Use test devices/accounts and provider test environments within the task's scope; do not send to production audiences as a smoke test.

Separate unit results for binding/navigation/dedup logic from device evidence for display and background delivery. Return the lifecycle matrix, actual handler symbols, payload/binding contract, test results and unverified provider/backend setup.

Use [mobile-firebase](../mobile-firebase/SKILL.md) only for FCM-specific setup, [deep-link diagnostics](../mobile-debug/references/deep-links.md) for association failures and [background guidance](../mobile-performance/references/background.md) for OS scheduling.

## Official sources

- [FCM token management](https://firebase.google.com/docs/cloud-messaging/manage-tokens)
- [Android notifications](https://developer.android.com/develop/ui/views/notifications)
- [Apple User Notifications](https://developer.apple.com/documentation/usernotifications)
- [Expo notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
