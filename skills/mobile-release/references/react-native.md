# Releasing a React Native app

A React Native release is an Android and an iOS release plus a JavaScript bundle. Store details, signing and rollout follow [android.md](android.md) and [ios.md](ios.md); EAS Build and Submit commands are also in `mobile-rn` → `references/performance-release.md`.

## Version

- **Bare React Native:** `versionCode`/`versionName` in `android/app/build.gradle`, and `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` in the Xcode project. `package.json`'s `version` is not used by either store unless a script copies it.
- **Expo:** `expo.version` in `app.json`/`app.config.(js|ts)` is the version name; `android.versionCode` and `ios.buildNumber` are the build numbers. With EAS, `"cli": { "appVersionSource": "remote" }` in `eas.json` lets EAS keep the build numbers, and `"autoIncrement": true` on the production profile increments them on each build.

## Build

- **Expo / EAS:** `eas build --platform all --profile production`, then `eas submit`. Credentials (keystore, certificates, provisioning) are managed by EAS unless the project configured local credentials.
- **Bare:** `./gradlew bundleRelease` in `android/`, and an Xcode archive for iOS.
- Environment: values in `EXPO_PUBLIC_*`, `react-native-config` and similar end up in the JavaScript bundle. Confirm the release build points at production and holds no secrets.

## Symbols and source maps

- JavaScript stack traces from release builds need the **source map** of that exact bundle. With Hermes, the map must be the composed one (Metro map combined with the Hermes bytecode map); crash reporters' React Native integrations (Sentry, Bugsnag, Crashlytics tooling) document how to generate and upload it.
- The native side still needs the R8 mapping and dSYMs, as in the Android and iOS guides.

## Over-the-air updates

- EAS Update (or another OTA service) changes JavaScript and assets without a store review. It cannot change native code, permissions or native dependencies: those need a store build.
- The **runtime version** decides which binaries can receive an update. A policy such as `fingerprint` or `appVersion` prevents shipping JavaScript that calls native code the installed binary does not have; a manual runtime version that nobody bumps is the classic cause of crashes after an update.
- Publish to a **channel** mapped to the production build (`eas update --channel production`), test it first on a preview channel with a build from the same commit, and know how to roll back (republish a previous update or roll back to the embedded bundle — check `eas update --help` for the commands in the installed CLI version).
- Store rules still apply: an OTA update must not change the app's purpose or add features that would need review.

## Before uploading

- [ ] `tsc --noEmit`, lint and tests pass on the release commit.
- [ ] Release build tested on real devices: Hermes, minification and the absence of the dev menu change behavior.
- [ ] `console.log` removed from release bundles (a Babel plugin such as `transform-remove-console`) when logs can contain user data.
- [ ] Config plugins and `expo prebuild` output match the committed native folders, when the project commits them.
- [ ] `expo-doctor` (Expo) or the React Native upgrade helper's checklist shows no version mismatches for native dependencies.

See [ci-cd.md](ci-cd.md) for pipelines.
