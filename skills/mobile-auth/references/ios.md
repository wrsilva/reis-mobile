# Authentication on iOS

- Use the provider-supported AuthenticationServices flow. For browser login, verify `ASWebAuthenticationSession` ownership, presentation context and callback configuration for the installed SDK/deployment target.
- For passkeys, configure the associated domain/relying party and verify responses on the server. Model cancellation, missing credentials and recovery explicitly.
- Treat Sign in with Apple identifiers and credentials through the provider contract. Do not depend on receiving profile fields on every sign-in, or equate a relay email with authority to merge accounts.
- Inspect Keychain accessibility and access groups against foreground/background needs. Keychain presence alone does not prove the server session is valid; define behavior across reinstall/account change.
- Guard shared refresh state across suspension points; invalidate late completions when the account changes.
- Test cancellation, return from browser, restored session, unavailable credentials and reauthentication with a configured test account.

Official references: [AuthenticationServices](https://developer.apple.com/documentation/authenticationservices), [ASWebAuthenticationSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession).
