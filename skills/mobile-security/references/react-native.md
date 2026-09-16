# React Native security checks

Apply after the general checks in `SKILL.md`. The native folders (`android/`, `ios/`) and native modules also get [android.md](android.md) and [ios.md](ios.md).

## Storage

- [ ] Tokens or credentials in `AsyncStorage` or MMKV without encryption. Use the Keychain/Keystore through `react-native-keychain` or `expo-secure-store`.

## Secrets in the bundle

- [ ] Secrets in `.env` files read through `react-native-config`, `babel` env plugins or `EXPO_PUBLIC_*` variables: they are inlined into the JavaScript bundle and readable in the APK or IPA.
- [ ] Secrets in `app.json`/`app.config.*` `extra`, which is bundled into the app.
- [ ] Hermes bytecode treated as protection: it is not obfuscation, and the bundle can be decompiled.

## Network

- [ ] `http://` endpoints allowed through native exceptions added for development and left in release (see the native references).
- [ ] Certificate pinning libraries configured with a single pin and no rotation plan.

## Platform

- [ ] `react-native-webview` with `originWhitelist={['*']}` and an `onMessage` handler that performs actions, or `injectedJavaScript` exposing tokens to remote content.
- [ ] Deep links handled through `Linking` or the navigation linking config without validating origin and parameters.
- [ ] Native modules exposing sensitive capabilities to JavaScript without validating arguments.

## Logs and updates

- [ ] `console.log` with sensitive data not removed in release builds (for example with `babel-plugin-transform-remove-console`).
- [ ] Over-the-air updates (`expo-updates` or other services) without code signing, so a compromised update channel can ship arbitrary JavaScript. Check whether the update service used supports signing and whether it is enabled.
