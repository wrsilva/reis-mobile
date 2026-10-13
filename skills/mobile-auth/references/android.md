# Authentication on Android

- Inspect the identity provider and resolved Credential Manager dependencies before choosing a sign-in API. Verify credential type and provider support on the app's OS/device range.
- Passkey registration/authentication exchanges server-generated request data and sends the response back for server verification. Validate the relying-party/domain association; a credential selector is not backend authorization.
- Give UI-bound credential/browser operations a valid host lifetime. Preserve attempt state across recreation as the SDK prescribes and distinguish user cancellation from invalid credentials.
- Coordinate logout with SDK credential/session state and the backend. Clearing a local credential preference does not revoke a remote session.
- Check [identity guides](../../mobile-android/references/identity.md) when restoring credentials or retrieving verified email; these features are separate from account merging.
- Test cancellation, no credential, provider unavailability, process recreation and account switching, including cached data isolation.

Official reference: [Credential Manager](https://developer.android.com/identity/credential-manager).
