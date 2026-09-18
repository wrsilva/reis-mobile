# Kotlin Multiplatform security

Trace a credential or sensitive value through shared code and both host apps. Mark the concrete storage and network implementations used by each target.

- A `commonMain` interface called `SecureStorage` is not proof of protection: inspect Android's Keystore-backed implementation and iOS Keychain implementation, their failure behavior and how logout clears each store. Do not claim an API exists until the dependency and target code confirm it.
- Check that shared serializers, caches and logs do not persist or emit tokens or personal data in plain text. Identify the exact object, path and caller.
- Check platform transport configuration in Android and iOS hosts: cleartext allowances, TLS overrides, deep-link handlers and WebView bridges are target-specific.
- Check that secrets are not embedded in shared resources or framework exports; anything bundled into either app is extractable.

For each finding, give **source path:line → target(s) → exposed object → consequence → fix**. Apply the [Android](android.md) and [iOS](ios.md) references to affected host files, and follow the project's actual storage/network dependencies. The shared source-set boundary is explained in [mobile-kmp](../../mobile-kmp/references/source-sets.md).
