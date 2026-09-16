# Android security checks

Apply after the general checks in `SKILL.md`, to native Android apps and to the `android/` folder of cross-platform apps. For a deep review of exported components, intents, `PendingIntent`s and intent redirection, follow [android/intent-security.md](android/intent-security.md).

## Manifest and components

- [ ] `activity`, `service`, `receiver` or `provider` with `android:exported="true"` without a permission and without validating the incoming `Intent`.
- [ ] `android:debuggable="true"` hardcoded in the manifest.
- [ ] `android:allowBackup="true"` (or absent) in an app with sensitive data, without backup and data extraction rules that exclude it.
- [ ] `PendingIntent`s created mutable without need, or with implicit base intents.
- [ ] App links without `android:autoVerify="true"` and a published Digital Asset Links file, so other apps can claim the same URLs.

## Network

- [ ] `android:usesCleartextTraffic="true"`, or a `network_security_config` with `cleartextTrafficPermitted="true"` for production domains.
- [ ] `network_security_config` trusting user-installed certificates (`<certificates src="user"/>`) outside `debug-overrides`.
- [ ] A custom `TrustManager` or `HostnameVerifier` that accepts everything.

## Storage and credentials

- [ ] Tokens in `SharedPreferences` or DataStore without encryption. Keep keys in the Android Keystore; Jetpack Security (`EncryptedSharedPreferences`) is deprecated, so check the current recommendation before introducing it.
- [ ] Keystore passwords in a committed `build.gradle(.kts)` instead of `key.properties` or environment variables.
- [ ] `BiometricPrompt` used without a `CryptoObject` when it protects credentials.

## UI and logs

- [ ] Screens with sensitive data without `WindowManager.LayoutParams.FLAG_SECURE`, which blocks screenshots and the recents thumbnail.
- [ ] `Log.d`/`Log.v` with sensitive data not stripped in release (R8 rules or a logging wrapper).

## WebView

- [ ] `setJavaScriptEnabled(true)` with `addJavascriptInterface` on content the app does not control.
- [ ] `setAllowFileAccess(true)` or universal access from file URLs enabled.

## Release

- [ ] R8 disabled (`isMinifyEnabled = false`) for release when the app has logic worth protecting.
