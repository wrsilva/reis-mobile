---
name: mobile-privacy
description: Implements and reviews mobile data privacy across Flutter, Android, iOS, React Native and Kotlin Multiplatform. Use for consent withdrawal, SDK collection controls, account and data deletion, retention, privacy manifests or store data disclosures. Covers the app and backend handoff; security exploits belong to mobile-security.
intents: [privacy]
stacks: ["*"]
---

# Mobile Privacy

Trace personal data from collection to deletion. Reuse the [project brief](../../docs/agent-context.md), then inspect initialization, SDK configuration, local stores and backend contracts before changing a flow. Preserve the requested operation: an audit produces findings; implementation changes the scoped flow and verifies it.

## Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Android | [references/android.md](references/android.md) |
| iOS | [references/ios.md](references/ios.md) |
| React Native / Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |

Cross-platform apps also need native references for SDK startup, permissions and store declarations. Confirm installed SDK versions and current destination-store policies; do not infer legal obligations from a permission flag or invent retention periods.

## Build the data inventory

Record each data category, collection call/site, purpose, recipient SDK/backend, local storage, retention owner, deletion mechanism and declaration. Include automatic collection before the first screen, native SDKs, extensions, queued telemetry and backups. Mark inaccessible server/console evidence as unknown.

## Consent is a lifecycle

- Distinguish OS permission, tracking authorization and purpose-specific app consent. Granting camera access does not authorize analytics or tracking.
- Define unknown, granted and withdrawn states for the purposes the product actually uses. Apply required defaults before collection starts; SDK initialization with collection disabled is valid when the SDK supports it.
- Persist the choice and restore it before relevant collectors run after a cold start. Define whether a choice belongs to an installation or account; do not silently inherit it across users.
- On withdrawal, stop relevant producers, cancel sends and discard queued data where required by the verified policy. An in-flight completion must not enqueue more data or re-enable collection. Use the SDK's supported deletion/reset controls and report their limits.
- Test the network behavior, not just the settings toggle. Confirm the denied/withdrawn path after relaunch and offline reconnection.

## Deletion and retention

- Bind deletion to the authenticated account and require appropriate confirmation/reauthentication. Use the backend's deletion contract; erasing local preferences or signing out is not account deletion.
- Model requested, pending, completed and failed states according to the real API. A timeout has an unknown outcome: query status or retry idempotently with server support, never display completed without evidence.
- Inventory removal from caches, databases, files, search indexes, telemetry identifiers and push bindings. Stop account work before clearing local state so late callbacks cannot recreate it.
- Document server/processor retention and backup expiry with the responsible owner. Explain verified exceptions and timelines; do not promise immediate global erasure if the backend cannot prove it.
- Account deletion and subscription cancellation are distinct operations. Preserve access to the store's management flow and explain the actual billing consequences using [billing guidance](../mobile-release/references/billing.md).

## Verify and deliver

Exercise first launch without a choice, grant, withdrawal with queued uploads, restart, account switch, deletion reauthentication cancellation, network failure and confirmed deletion. Inspect sanitized traffic and local storage; use test accounts for server-side destructive checks within the task's authorization.

Return the data inventory with `path:symbol` evidence, implemented state transitions, test results and any unverified backend/store declaration. Use [mobile-security](../mobile-security/SKILL.md) for storage/transport threats, [mobile-observability](../mobile-observability/SKILL.md) for telemetry and [mobile-release](../mobile-release/SKILL.md) for submission readiness.

## Official sources

- [Apple privacy and data use](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [Android privacy](https://developer.android.com/privacy)
