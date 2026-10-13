# Authentication in Flutter

- Inspect the installed provider plugin and the app's session state owner. Use its auth-state stream once at the appropriate lifetime; avoid separate login state in each screen.
- Verify native callback configuration on Android and iOS alongside Dart routing. A successful provider callback is not evidence the backend session was established.
- Restore secure credentials before making account-scoped requests; do not show another account's cached content while restoration is unresolved.
- Passkey support depends on the actual plugin and host versions. Trace its registration/assertion response to backend verification; do not replace this with a local biometric boolean.
- Cancel/dispose listeners and invalidate in-flight refresh/login results on logout. Test the session state owner separately from widget navigation, then test the native callback in a device build.

Reuse [Firebase Auth guidance](../../mobile-firebase/references/flutter/auth.md) when installed and [secure token storage](../../mobile-security/references/flutter/secure-token-store.md). Official reference: [Flutter app links](https://docs.flutter.dev/cookbook/navigation/set-up-app-links).
