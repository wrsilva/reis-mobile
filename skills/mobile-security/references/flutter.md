# Flutter security checks

Apply after the general checks in `SKILL.md`. The native folders (`android/`, `ios/`) also get [android.md](android.md) and [ios.md](ios.md).

## Storage

- [ ] Tokens in `shared_preferences`, `hive` or `sqflite` without encryption. Use `flutter_secure_storage`, which stores values in the Keychain on iOS and Keystore-backed storage on Android: [flutter/secure-token-store.md](flutter/secure-token-store.md).
- [ ] Sensitive data cached in plain files under the app documents directory.

## Network

- [ ] `HttpClient.badCertificateCallback` returning `true`, or `HttpOverrides.global` disabling validation: Critical if it reaches the release build.
- [ ] `dio` or `http` clients built with custom certificate handling that accepts everything outside debug.

## Secrets and logs

- [ ] `print`/`debugPrint`/`log` with a token, `Authorization` header or login payload; `dio`'s `LogInterceptor` enabled in release.
- [ ] Secrets passed with `--dart-define` or `--dart-define-from-file` and treated as safe: they end up in the binary.

## Release hardening

- [ ] Release builds without `--obfuscate --split-debug-info=<dir>` when the app needs obfuscation. Keep the split debug info to symbolicate crashes.
- [ ] `kDebugMode`-only checks that also guard security behavior, so the check disappears in release.

## Platform

- [ ] `webview_flutter` with `JavaScriptMode.unrestricted` and `addJavaScriptChannel` loading URLs the app does not control.
- [ ] Deep links (`go_router`, `app_links`, `uni_links`) that navigate to privileged screens or perform actions without validating parameters and authentication.
- [ ] Platform channels that expose native capabilities (files, keychain, device identifiers) to any Dart caller without validating arguments.
- [ ] Biometric login with `local_auth` that only returns a boolean; bind it to a key stored behind biometric protection when it guards credentials.
