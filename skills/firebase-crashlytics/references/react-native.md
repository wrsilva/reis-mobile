# Firebase Crashlytics — React Native

Use this reference instead of the Dart code in `SKILL.md` when the project is a React Native or Expo app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Use React Native Firebase: `@react-native-firebase/app` plus one package per product (below). Add `google-services.json` and `GoogleService-Info.plist` to the native projects, or reference them in the config plugins with Expo.
- Expo: React Native Firebase needs a development build with config plugins (`npx expo prebuild`); it does not run in Expo Go.
- iOS: on React Native 0.75+, React Native Firebase resolves the Firebase Apple SDK with Swift Package Manager by default, which requires dynamic frameworks (`use_frameworks! :linkage => :dynamic`). Static frameworks require opting out of SPM. Follow the installation page for the version in `package.json`.
- Prefer the modular API (`getAuth()`, `onAuthStateChanged(getAuth(), ...)`) over the deprecated namespaced API (`auth().onAuthStateChanged(...)`), and match what the installed version documents.
- The Firebase JS SDK (the `firebase` npm package) is a different library. Do not mix it with React Native Firebase for the same product.

## Package

`@react-native-firebase/crashlytics`

## Setup notes

- Android: apply the `com.google.firebase.crashlytics` Gradle plugin in the app module, as the installation page describes.
- iOS: follow the installation page for the dSYM upload build phase and `DWARF with dSYM File`.
- Behavior flags such as `crashlytics_debug_enabled` and `crashlytics_auto_collection_enabled` live in `firebase.json` at the project root.

## Usage

```ts
import { getCrashlytics, log, recordError, setUserId, setAttributes } from '@react-native-firebase/crashlytics';

const crashlytics = getCrashlytics();
await setUserId(crashlytics, opaqueUserId);          // an internal id, never an email
await setAttributes(crashlytics, { screen: 'checkout' });
log(crashlytics, 'payment started');
recordError(crashlytics, error);                      // non-fatal JavaScript error
```

## Notes

- Errors caught by an error boundary are not crashes; record them with `recordError` so they appear in the console.
- Keep development builds out of production reports (`crashlytics_debug_enabled` in `firebase.json`).
- Reports are sent on the next launch after a crash.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
