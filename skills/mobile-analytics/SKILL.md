---
name: mobile-analytics
description: Designs and reviews product analytics across Flutter, Android, iOS, React Native and Kotlin Multiplatform. Use for tracking plans, event names and properties, funnels and conversion events, screen tracking, analytics identity across sign-in and sign-out, consent-gated collection and validating events before release. Crash, error and performance telemetry belong to mobile-observability.
intents: [analytics]
stacks: ["*"]
---

# Mobile Analytics

An analytics event is a contract with whoever reads the dashboard. Trace each event from the user action to the destination and to the question it answers. Reuse the [project brief](../../docs/agent-context.md), then inspect the SDK initialization, the existing event calls, the tracking plan if one exists and the owner of consent state before adding events.

## Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Android | [references/android.md](references/android.md) |
| iOS | [references/ios.md](references/ios.md) |
| React Native / Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |

Cross-platform apps also need the native references: SDKs often collect automatically before Dart or JavaScript runs. Confirm the SDK and its version from the lock file.

## Write the tracking plan first

For each event record the name, the exact trigger, the properties with their types and allowed values, the owner and the product question it answers. "Order completed" fires after the server confirms the order, not when the button is tapped. Follow the naming already in the plan or the SDK's conventions, and check the destination's documented limits for names, property counts and value lengths. An event nobody reads costs battery, data and privacy review; remove it from the plan.

## Emit through one boundary

- Send every event through one app-owned analytics interface with typed events. SDK calls scattered across screens cannot be gated by consent, tested or moved to another vendor.
- Fire each event once, on the confirmed outcome. Rebuilds, recomposition, re-renders, retries, back navigation and app resume must not duplicate it.
- Track screen views from the navigation owner, not from build or render code.
- Attach no direct personal data: no email, phone number, name or free text the user typed. Identify users with a stable internal id, never with an email.

## Identity and consent

- Before sign-in, events belong to the SDK's anonymous id. On sign-in, set the internal user id. On sign-out or an account switch, reset the analytics identity so the next user's events are not attributed to the previous one.
- Collection follows the consent state owned by [mobile-privacy](../mobile-privacy/SKILL.md). Start with collection disabled where the SDK supports it until consent is known, and stop sending on withdrawal.
- Whether a use counts as tracking under Apple's rules, and what the store data disclosures must declare, depends on the data and its recipients. Check the declarations against the actual collection.

## Delivery and trust

SDKs batch and upload events, so events can arrive late, offline events can be dropped by the SDK's limits and events in flight can be lost when the process dies. Do not use client analytics as the source of truth for revenue or business records: purchase revenue comes from the backend and store notifications through [mobile-billing](../mobile-billing/SKILL.md).

## Verify and deliver

Unit-test that a flow produces the expected typed events through a fake analytics implementation, including no events before consent, one event per confirmed outcome and an identity reset on sign-out. Then use the destination's debug or live event view with a debug build to confirm names and properties arrive as planned.

Return the tracking plan changes, `path:symbol` for each emission, test results and any dashboard or destination configuration you could not verify. Use [mobile-observability](../mobile-observability/SKILL.md) for crashes, errors and performance signals and [mobile-firebase](../mobile-firebase/SKILL.md) for Firebase Analytics setup.

## Official sources

- [Firebase Analytics events](https://firebase.google.com/docs/analytics/events)
- [Apple user privacy and data use](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)
