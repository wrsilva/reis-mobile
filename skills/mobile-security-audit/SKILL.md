---
name: mobile-security-audit
description: Security audit for mobile apps based on the OWASP MASVS categories — insecure token storage, hardcoded secrets, cleartext traffic, TLS validation bypass, exported components, WebView exposure, sensitive logging and release hardening — with concrete checks for Flutter, Android, iOS and React Native. Use when reviewing mobile code, auditing app security, handling authentication or tokens, or preparing a release.
intents: [review, security, release]
stacks: ["*"]
---

# Mobile Security Audit

Organized by the OWASP MASVS categories. Apply the general section and then the one for the detected stack (in cross-platform apps, also apply Android and iOS to the native folders).

Every finding needs evidence in the code or configuration. Severity:

- **Critical:** exposed credential or sensitive data, TLS validation disabled, exported component that performs a privileged action.
- **High:** token in insecure storage, cleartext traffic to the API, WebView with a JavaScript bridge exposed to remote content.
- **Medium/Low:** missing hardening, verbose logs, backup enabled without need.

## General (all stacks)

**MASVS-STORAGE**
- [ ] Access token, refresh token and personal data kept in insecure storage (preferences, files, unencrypted database).
- [ ] Sensitive data in logs, analytics or crash reports.

**MASVS-CRYPTO**
- [ ] Private API keys, client secrets, signing keys or passwords in source code, assets or bundled configuration files. Everything shipped in the app can be extracted; a real secret stays on the backend.
- [ ] Homemade cryptography, fixed IV/key, MD5/SHA-1 for passwords.

**MASVS-AUTH**
- [ ] Authorization decided only on the client (local `isAdmin` flag, hiding a button as access control).
- [ ] Session without expiration or refresh token never invalidated on logout.
- [ ] Biometrics used only as a local boolean, without binding to a cryptographic key.

**MASVS-NETWORK**
- [ ] `http://` URLs for APIs.
- [ ] Certificate validation disabled.
- [ ] Pinning, if present, without a rotation strategy (single pin with no backup).

**MASVS-PLATFORM**
- [ ] Deep links and universal links that perform actions without validating parameters or without authentication.
- [ ] WebView loading remote content with JavaScript and a native bridge enabled.
- [ ] Sensitive data on the clipboard or visible in the app switcher snapshot.

**MASVS-CODE / RESILIENCE**
- [ ] Release build without obfuscation/minification when the app has sensitive logic.
- [ ] Debug code or endpoints reachable in release.

**MASVS-PRIVACY**
- [ ] Permissions requested without real use in the code.
- [ ] Third-party SDKs collecting undeclared data (Privacy Manifest on iOS, Data safety on the Play Store).

## Flutter

- [ ] Tokens in `shared_preferences`, `hive` or `sqflite` without encryption: use `flutter_secure_storage` (Keychain/Keystore).
- [ ] `HttpClient.badCertificateCallback` returning `true` or `HttpOverrides.global` disabling validation: Critical if it reaches the release build.
- [ ] `print`/`debugPrint`/`log` with a token, `Authorization` header or login payload. `dio` interceptors with `LogInterceptor` active in release.
- [ ] Secrets passed via `--dart-define` and treated as safe: they end up in the binary.
- [ ] Release build without `--obfuscate --split-debug-info` when the app needs obfuscation.
- [ ] `webview_flutter` with `JavaScriptMode.unrestricted` and `addJavaScriptChannel` loading an uncontrolled URL.

## Android (Kotlin/Java, or `android/` in cross-platform apps)

- [ ] `AndroidManifest.xml`: `android:usesCleartextTraffic="true"` or `network_security_config` with `cleartextTrafficPermitted="true"` for production domains.
- [ ] `network_security_config` trusting user certificates (`<certificates src="user"/>`) in release.
- [ ] `android:allowBackup="true"` (or absent) in an app with sensitive data, without exclusion rules.
- [ ] `activity`/`service`/`receiver`/`provider` with `android:exported="true"` without a permission and without validating the `Intent`.
- [ ] `android:debuggable="true"` hardcoded in the manifest.
- [ ] Tokens in `SharedPreferences` without encryption.
- [ ] `WebView` with `setJavaScriptEnabled(true)` + `addJavascriptInterface` or `setAllowFileAccess(true)`.
- [ ] Custom `TrustManager`/`HostnameVerifier` that accepts everything.
- [ ] `Log.d`/`Log.v` with sensitive data not stripped in release (R8 rules or a log wrapper).
- [ ] Keystore passwords in a committed `build.gradle` instead of `key.properties`/environment variables.

## iOS (Swift/Objective-C, or `ios/` in cross-platform apps)

- [ ] `Info.plist`: `NSAppTransportSecurity` with `NSAllowsArbitraryLoads = true` without a justified per-domain exception.
- [ ] Tokens in `UserDefaults` or files instead of the Keychain.
- [ ] Keychain items with permissive accessibility (`kSecAttrAccessibleAlways*`, already deprecated) instead of `...WhenUnlocked`/`...AfterFirstUnlock`.
- [ ] `URLSessionDelegate` accepting any `serverTrust` without evaluating it.
- [ ] Custom URL schemes performing actions without validation (prefer universal links).
- [ ] `NSLog`/`print` with sensitive data.
- [ ] Screen with sensitive data without snapshot protection when going to background.

## React Native

- [ ] Tokens in `AsyncStorage`: use Keychain/Keystore (`react-native-keychain`, `expo-secure-store`).
- [ ] `.env` via `react-native-config`/`expo-constants` with secrets: they go into the JS bundle, readable in the APK/IPA.
- [ ] `react-native-webview` with `originWhitelist={['*']}` and `onMessage` performing actions.
- [ ] `console.log` with sensitive data not stripped in release (for example, `babel-plugin-transform-remove-console`).
- [ ] Deep links handled in `Linking` without validating origin and parameters.

## Useful commands (read-only)

```bash
git ls-files | grep -Ei '\.(jks|keystore|p12|p8|mobileprovision|env)$|key\.properties|google-services\.json|GoogleService-Info\.plist'
grep -rn --include='*.xml' -E 'usesCleartextTraffic|allowBackup|exported="true"|debuggable' android app 2>/dev/null
grep -rn -E 'NSAllowsArbitraryLoads' --include='*.plist' . 2>/dev/null
```

## Output

Report under **Security** (or **Critical**, when the severity is Critical), with the MASVS category, `file:line`, impact and fix.
