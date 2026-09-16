---
name: mobile-security
description: Security review and hardening for mobile apps on every stack, organized by the OWASP MASVS categories — insecure token and credential storage, hardcoded secrets, cleartext traffic and TLS validation bypass, certificate pinning, exported components and intent handling, deep links, WebView bridges, biometrics, sensitive logging, backups, screenshots and release hardening — with concrete checks for Flutter, native Android, native iOS and React Native. Use when reviewing mobile code for security, auditing an app before release, storing tokens or credentials, handling authentication, deep links or WebViews, or when the user mentions OWASP, MASVS, pentest findings or store security requirements.
intents: [review, security, release]
stacks: ["*"]
---

# Mobile Security

Organized by the OWASP MASVS categories. Apply the general checks below, then the reference for the detected stack. In cross-platform apps, also apply the Android and iOS references to the native folders.

## 1. Pick the reference

| Project | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Native Android (Kotlin/Java), or `android/` in any app | [references/android.md](references/android.md) |
| Native iOS (Swift/Objective-C), or `ios/` in any app | [references/ios.md](references/ios.md) |
| React Native or Expo | [references/react-native.md](references/react-native.md) |

Firebase-specific protection (security rules, App Check) is covered by `mobile-firebase`.

## 2. Evidence and severity

Every finding needs evidence in the code or configuration at `file:line`. Severity:

- **Critical:** exposed credential or sensitive data, TLS validation disabled, exported component that performs a privileged action, backend authorization missing.
- **High:** token in insecure storage, cleartext traffic to the API, WebView with a JavaScript bridge exposed to remote content, deep link acting without validation.
- **Medium/Low:** missing hardening, verbose logs, backup enabled without need, missing screenshot protection.

## 3. General checks (all stacks)

**MASVS-STORAGE**
- [ ] Access token, refresh token and personal data kept in insecure storage (preferences, plain files, unencrypted database) instead of the Keychain or Keystore-backed storage.
- [ ] Sensitive data in logs, analytics events or crash reports.

**MASVS-CRYPTO**
- [ ] Private API keys, client secrets, signing keys or passwords in source code, assets or bundled configuration. Everything shipped in the app can be extracted; a real secret stays on the backend.
- [ ] Homemade cryptography, fixed IV or key, MD5/SHA-1 for passwords.

**MASVS-AUTH**
- [ ] Authorization decided only on the client (a local `isAdmin` flag, hiding a button as access control).
- [ ] Sessions without expiration, or refresh tokens never invalidated on logout.
- [ ] Biometrics used only as a local boolean, without unlocking a key in the Keychain or Keystore.

**MASVS-NETWORK**
- [ ] `http://` URLs for APIs.
- [ ] Certificate validation disabled or overridden to accept everything.
- [ ] Pinning, if present, without a rotation strategy (a single pin with no backup).

**MASVS-PLATFORM**
- [ ] Deep links and universal/app links that perform actions without validating parameters or without authentication.
- [ ] WebViews loading remote content with JavaScript and a native bridge enabled.
- [ ] Sensitive data on the clipboard or visible in the app switcher snapshot.

**MASVS-CODE / RESILIENCE**
- [ ] Release builds without obfuscation or minification when the app has sensitive logic.
- [ ] Debug code, test endpoints or feature flags that bypass checks reachable in release.
- [ ] Dependencies with known vulnerabilities, or abandoned security-sensitive libraries.

**MASVS-PRIVACY**
- [ ] Permissions requested without real use in the code.
- [ ] Third-party SDKs collecting data that is not declared (privacy manifest and App Store privacy details on iOS, Data safety on Google Play).

## 4. Useful commands (read-only)

```bash
# Signing material and environment files that should not be in the repository
git ls-files | grep -Ei '\.(jks|keystore|p12|p8|pem|mobileprovision)$|key\.properties|(^|/)\.env(\.|$)'

# Android manifest flags worth reading in context
grep -rn --include='AndroidManifest.xml' -E 'usesCleartextTraffic|allowBackup|exported="true"|debuggable' . 2>/dev/null

# iOS App Transport Security exceptions
grep -rn --include='*.plist' 'NSAllowsArbitraryLoads' . 2>/dev/null
```

`google-services.json` and `GoogleService-Info.plist` identify a Firebase project and ship in every app; committing them is not a leak by itself. The findings there are unrestricted API keys and weak security rules.

## Output

Report under **Security** (or **Critical**, when the severity is Critical), with the MASVS category, `file:line`, impact and fix.
