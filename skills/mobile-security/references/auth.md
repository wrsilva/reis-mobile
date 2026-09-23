# OAuth 2.0, OIDC and PKCE in mobile apps

Applies to every stack. A mobile app is a **public client**: it cannot keep a secret, because anything shipped in the binary can be extracted. Every rule here follows from that one fact, and the authoritative source is **RFC 8252, "OAuth 2.0 for Native Apps"**, which the major identity providers implement and enforce.

## The three rules that decide whether the flow is correct

1. **Authorization Code flow with PKCE. Nothing else.** The Implicit flow and the Resource Owner Password Credentials flow are both disallowed for native apps — implicit returns tokens in a redirect where they leak, and ROPC makes the app handle the password, defeats federated login and blocks MFA. If the code sends a username and password to a `/token` endpoint, that is the finding.
2. **No client secret in the app.** A "confidential" client registration used by a mobile binary is a published secret. Register the app as a public client; PKCE is what replaces the secret.
3. **The authorization request runs in the system browser, not in a WebView.** RFC 8252 requires an external user-agent — `ASWebAuthenticationSession` on iOS, Custom Tabs on Android — because it shares the system's session (so SSO works), shows the real URL and certificate to the user (so phishing is detectable), and keeps the app out of the credential entry. An embedded `WebView` on the login page gives the app access to the user's typed password and is rejected by most identity providers.

## PKCE, concretely

PKCE (RFC 7636) stops an attacker who intercepts the redirect — a malicious app that registered the same custom scheme, or a log that captured the URL — from exchanging the authorization code.

```
verifier  = 43–128 chars from [A-Z a-z 0-9 - . _ ~], from a cryptographic RNG
challenge = BASE64URL( SHA256( verifier ) )     ← method "S256"

/authorize?...&code_challenge=<challenge>&code_challenge_method=S256
/token     ...&code=<code>&code_verifier=<verifier>
```

What to check in review:

- [ ] `code_challenge_method` is `S256`. The `plain` method provides no protection and exists only for constrained clients.
- [ ] The verifier comes from a **cryptographic** random source — `SecureRandom`, `SecRandomCopyBytes`, `Random.secure()`, `crypto.getRandomValues` — never `Math.random()`, a timestamp or a UUID v4 from a non-crypto source.
- [ ] A fresh verifier per authorization request, held only in memory, discarded after the exchange.
- [ ] The `state` parameter is present, random, and **verified** on the callback. `state` is CSRF protection and is separate from PKCE; PKCE does not replace it.
- [ ] With OIDC, the `nonce` is sent and checked against the `nonce` claim in the ID token.

## Redirects

The redirect URI is how the code gets back to the app, and it is the weak point.

- **Prefer verified app links**: `https` App Links on Android (with `assetlinks.json` on the domain) and Universal Links on iOS (with `apple-app-site-association`). These are the only redirect types the OS ties to a domain you own; another app cannot claim them.
- **Custom schemes are claimable** by any installed app. If one is used, it must be app-specific and unguessable-ish (the reverse-DNS form providers recommend, e.g. `com.example.app:/oauth2redirect`), and PKCE must be present — with PKCE, a stolen code is useless.
- **Loopback redirects** (`http://127.0.0.1:<port>`) are the desktop pattern and are not appropriate on mobile.
- Validate the callback: correct `state`, expected issuer, and no code reuse.

## Tokens

- **Storage:** the Keychain on iOS and Keystore-backed storage on Android — never `UserDefaults`, `SharedPreferences`, `AsyncStorage`, a plain file, `localStorage` in a WebView, or the JavaScript bundle. Per-stack APIs are in the platform references of this skill.
- **Access tokens are short-lived** (minutes to an hour). A long-lived access token is a finding by itself.
- **Refresh tokens must rotate.** Each refresh returns a new refresh token and invalidates the old one; a reused old token means theft, and the server must revoke the whole family. Rotation with reuse detection is the mobile standard because a public client cannot prove its identity any other way.
- **Never put a token in a URL**, a log line, an analytics event, a crash-report attribute or a breadcrumb — see [mobile-observability](../../mobile-observability/SKILL.md).
- **Validate the ID token** if the client uses its claims: signature against the provider's JWKS, `iss`, `aud`, `exp`, and `nonce`. An ID token is proof of authentication for the client; it is **not** an access token and must never be sent to your API as one.
- **Authorization is the backend's decision.** Claims decoded on the device decide what to render, never what is allowed. A client that reads `role: admin` from a token and unlocks a feature is a client-side authorization finding regardless of how well the token is stored.
- **Logout** must revoke the refresh token at the provider (`revocation_endpoint`), clear the token store, and end the browser session where the provider supports RP-initiated logout. Deleting the local copy alone leaves a valid session on the server.

## Biometrics do not authenticate to your server

A biometric prompt that returns `true` and unlocks a screen proves nothing to the backend and can be bypassed on a compromised device. Biometrics are correct when they **gate access to a key**: the token or a key that decrypts it is stored with biometric-backed access control (`kSecAccessControlBiometryCurrentSet` on iOS, `setUserAuthenticationRequired` on an Android Keystore key), so failing the prompt makes the data undecryptable rather than just hiding a screen.

Invalidate on enrolment change: adding a fingerprint or face must invalidate the key, or a coerced enrolment grants access.

## Use the platform libraries

Hand-written OAuth is where these mistakes accumulate. Prefer a maintained implementation that already does RFC 8252 correctly, and keep the verifier, `state` and browser handling out of your own code:

| Stack | Typical choice |
|---|---|
| Android | AppAuth for Android, or the identity provider's own SDK; Custom Tabs for the browser |
| iOS | AppAuth for iOS, or the provider's SDK; `ASWebAuthenticationSession` for the browser |
| Flutter | `flutter_appauth`, or the provider's Flutter SDK; secure storage for tokens |
| React Native / Expo | `react-native-app-auth`, or `expo-auth-session` (which implements PKCE); never a `WebView` |
| Kotlin Multiplatform | The host apps own the browser flow; keep only token *use* and refresh scheduling in shared code |

Check what the chosen library defaults to. Some have an option to use an embedded WebView or to disable PKCE for legacy providers — both turn a compliant flow into a non-compliant one silently.

## Review checklist

- [ ] Authorization Code + PKCE (`S256`); no implicit, no password grant.
- [ ] No client secret in the app, the repository, or the CI configuration that builds it.
- [ ] System browser (`ASWebAuthenticationSession` / Custom Tabs), not a `WebView`.
- [ ] Cryptographic RNG for the verifier and `state`; `state` and `nonce` verified.
- [ ] Redirect URI is an App Link / Universal Link, or an app-specific scheme with PKCE.
- [ ] Tokens in Keychain/Keystore-backed storage, short-lived access token, rotating refresh token with reuse detection.
- [ ] No token in logs, URLs, analytics or crash reports.
- [ ] ID token validated if used; never sent as an access token.
- [ ] Authorization enforced by the backend on every request.
- [ ] Logout revokes server-side.
- [ ] Biometrics gate a key, not a boolean; enrolment changes invalidate it.

## Official documentation

- RFC 8252, OAuth 2.0 for Native Apps: https://datatracker.ietf.org/doc/html/rfc8252
- RFC 7636, Proof Key for Code Exchange: https://datatracker.ietf.org/doc/html/rfc7636
- OAuth 2.0 Security Best Current Practice: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics
- OpenID Connect Core: https://openid.net/specs/openid-connect-core-1_0.html
- OWASP MASVS, authentication and session management: https://mas.owasp.org/MASVS/05-MASVS-AUTH/
- ASWebAuthenticationSession: https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession
- Android Custom Tabs: https://developer.chrome.com/docs/android/custom-tabs
