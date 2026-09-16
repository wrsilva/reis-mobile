# iOS security checks

Apply after the general checks in `SKILL.md`, to native iOS apps and to the `ios/` folder of cross-platform apps.

## Network

- [ ] `NSAppTransportSecurity` with `NSAllowsArbitraryLoads = true` in `Info.plist` without a justified per-domain exception.
- [ ] A `URLSessionDelegate` that accepts any `serverTrust` without evaluating it.

## Storage and credentials

- [ ] Tokens in `UserDefaults`, property lists or files instead of the Keychain.
- [ ] Keychain items with permissive accessibility (`kSecAttrAccessibleAlways*`, deprecated) instead of `...WhenUnlocked` or `...AfterFirstUnlock`; `ThisDeviceOnly` variants for secrets that must not migrate to other devices through backups.
- [ ] Files with sensitive data written without an appropriate Data Protection class.
- [ ] Biometrics checked with `LAContext.evaluatePolicy` only as a boolean when they guard credentials; protect the Keychain item with `SecAccessControl` and biometry instead.

## Platform

- [ ] Custom URL schemes performing actions without validation; any app can register the same scheme. Prefer universal links for sensitive flows.
- [ ] Screens with sensitive data without protection in the app switcher snapshot (cover the content when the scene moves to the background).
- [ ] Sensitive data copied to `UIPasteboard.general` without an expiration or local-only option.
- [ ] `WKWebView` loading remote content with `WKScriptMessageHandler`s that perform privileged actions.

## Logs and privacy

- [ ] `NSLog`, `print` or `os_log` with sensitive data; `os_log`/`Logger` values that should be private must not be marked public.
- [ ] Missing or inaccurate privacy manifest (`PrivacyInfo.xcprivacy`) for the app and third-party SDKs that use required-reason APIs or collect data; check Apple's current requirements.
