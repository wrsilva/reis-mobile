---
name: mobile-networking
description: Implements and reviews mobile API integration across Flutter, Android, iOS, React Native and Kotlin Multiplatform. Use for HTTP clients, pagination, request cancellation, concurrent token refresh, resumable uploads and WebSocket lifecycle. Durable offline mutation queues belong to mobile-offline-sync.
intents: [networking]
stacks: ["*"]
---

# Mobile Networking

Start from the [project brief](../../docs/agent-context.md). Locate the actual client, request/response models, repository, session owner and nearest tests. Read the server contract or observed sanitized responses before designing pagination, retries or upload recovery. Preserve the requested audit/implementation scope.

## Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Android | [references/android.md](references/android.md) |
| iOS | [references/ios.md](references/ios.md) |
| React Native / Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |

## Define the request contract

- Record endpoint, method, identity, input bounds, response mapping, timeout/deadline, cancellation owner and observable failure. Keep transport details out of UI components.
- Validate untrusted responses at the boundary. Distinguish transport, HTTP, decoding and domain failures without exposing bodies or credentials in user messages/logs.
- Scope cache keys and in-flight results to the account, query and filters. An account change invalidates the old generation; late responses cannot write into the new account's store.
- Propagate cancellation to the transport when supported and fence late completions regardless. Leaving a screen is not evidence that a mutation was rolled back on the server.

## Recover without duplicating work

- Treat a connection indicator as a hint; still handle request failure. Bound retries by attempt count/deadline, use backoff and honor applicable server retry instructions.
- Retry reads when their semantics permit it. Replay a mutation only when its server contract makes replay safe, for example an idempotency key retained for the same logical operation. A timed-out purchase/upload may already have succeeded.
- Coalesce refresh work for one active session. Waiting requests share its result, retry with a fresh credential at most within the declared budget, and do not recursively refresh a failing refresh endpoint.
- Check session generation before persisting refreshed credentials or replaying requests. Logout/account switch cancels or invalidates the old refresh; do not resurrect that session. Distinguish invalid credentials from temporary network failure.
- Use [offline sync](../mobile-offline-sync/SKILL.md) for durable queues, reconciliation and conflict resolution; use [security auth guidance](../mobile-security/references/auth.md) for the login protocol.

## Pagination, transfers and real time

- Follow the server's cursor/offset contract. Reset pagination on account/filter change, prevent overlapping page loads and handle an exhausted cursor explicitly. Do not infer the next cursor from item count unless the API specifies it.
- Avoid buffering large files entirely in memory. Report progress from transferred bytes where available; cancellation and failure must release file/stream resources.
- Resume only if the server protocol supports it. Persist the upload identity securely, query acknowledged state after interruption, handle expiry, and validate completion before publishing the resulting object. Background continuation depends on native OS APIs, not a timer.
- Give a WebSocket one owner. Bound reconnection, refresh authentication appropriately, and specify missed-event recovery with the server (cursor/replay/snapshot). Reconnect alone does not recover events lost while suspended.

## Verify and deliver

Test concurrent 401s, refresh failure, logout during refresh, late responses after account switch, timeout after server acceptance, malformed response, cancelled pagination, upload interruption and reconnect with missed events. Use a fake transport or local test server and virtual time for deterministic retries; test native background behavior separately.

Return the actual request/state contract, changed symbols, failure-to-UI mapping, tests run and unknown server guarantees. Reference [background execution](../mobile-performance/references/background.md) for scheduling and [observability](../mobile-observability/SKILL.md) for sanitized diagnostics.

Official source: [HTTP semantics, including idempotence and Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html).
