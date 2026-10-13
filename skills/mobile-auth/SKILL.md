---
name: mobile-auth
description: Implements and reviews mobile identity and session flows across Flutter, Android, iOS, React Native and Kotlin Multiplatform. Use for sign-in, passkeys, account recovery, provider linking, reauthentication, logout and concurrent refresh. Security audits belong to mobile-security; account deletion belongs to mobile-privacy.
intents: [auth]
stacks: ["*"]
---

# Mobile Authentication

Use the [project brief](../../docs/agent-context.md) to find the provider SDK/configuration, session owner, credential store, redirect handlers and account-scoped repositories. Preserve the chosen provider and the requested audit/implementation scope. Read installed versions and the provider's actual backend contract before selecting APIs.

## Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Android | [references/android.md](references/android.md) |
| iOS | [references/ios.md](references/ios.md) |
| React Native / Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |

## Define identity and session transitions

- Separate provider identity, backend account, session credentials and local unlock. Biometric approval alone is not server authentication.
- Model restoring, signed out, authenticating, signed in, reauthentication required and signing out as needed by the real flow. Temporary offline restoration is distinct from proven invalid credentials.
- Give each attempt a correlation identifier and cancellation owner. A cancelled sign-in or reauthentication preserves any existing valid session; it cannot silently replace it with a partially authenticated account.
- Complete account switching by invalidating old jobs, caches and notification bindings before exposing the new account's data. Fence late callbacks with account/session generation.

## Choose the provider-supported ceremony

- For OAuth/OIDC native login, use a maintained provider/library implementation of Authorization Code with PKCE through the system authentication browser. Keep client secrets off the app; verify redirect association and response binding using the SDK's documented protections.
- For passkeys, the backend issues challenges and verifies registration/authentication responses, relying-party identity and replay protections. Native credential APIs alone do not prove identity to your backend. Define recovery for unavailable credentials without weakening authentication.
- Link providers only after proving control according to the provider contract; matching email strings is not sufficient authority to merge accounts. Define collisions, cancellation and recovery before altering account ownership.
- Treat sensitive actions as backend-authorized operations with the required fresh authentication. Do not bypass reauthentication by changing a UI flag.

## Refresh, logout and recovery

- Use the provider SDK's session management if it already owns refresh. Otherwise coalesce refresh work per session; every waiter receives success, cancellation or failure, and retries have a bound.
- Before saving a refresh result, check that the session is still current. Logout/account switch must make an old result inert, including its queued request replays.
- Apply the provider's supported refresh-token protection. OAuth security guidance supports rotation or sender-constrained refresh tokens for public clients; do not invent a rotation endpoint or override SDK behavior.
- On logout, invalidate local access and clear scoped state. Track remote revocation separately when supported; if offline, report that it was not confirmed and use the provider's documented recovery strategy. Browser SSO logout and app logout are different operations.
- Recovery, MFA and linking error messages follow the actual identity provider and product requirements. Avoid exposing whether another account exists through custom recovery behavior.

## Verify and deliver

Test cancelled login, malformed/replayed callback, process recreation during login, concurrent refresh, offline restoration, logout during refresh, account switching, unavailable passkey, linking collision and cancelled reauthentication. Exercise provider integration in its test environment; keep tokens and personal data out of fixtures/logs.

Return a transition table tied to real symbols, provider/backend boundaries, storage and redirect changes, test results and remaining configuration evidence. Use [mobile-security](../mobile-security/SKILL.md) for threat review and secure storage, [mobile-firebase](../mobile-firebase/SKILL.md) for Firebase Auth APIs, and [mobile-privacy](../mobile-privacy/SKILL.md) for deletion.

## Official sources

- [OAuth for native apps, RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html)
- [OAuth security best current practice, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html)
- [Android Credential Manager](https://developer.android.com/identity/credential-manager)
- [Apple AuthenticationServices](https://developer.apple.com/documentation/authenticationservices)
