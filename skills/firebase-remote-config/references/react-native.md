# Firebase Remote Config — React Native

Use this reference instead of the Dart code in `SKILL.md` when the project is a React Native or Expo app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Use React Native Firebase: `@react-native-firebase/app` plus one package per product (below). Add `google-services.json` and `GoogleService-Info.plist` to the native projects, or reference them in the config plugins with Expo.
- Expo: React Native Firebase needs a development build with config plugins (`npx expo prebuild`); it does not run in Expo Go.
- iOS: on React Native 0.75+, React Native Firebase resolves the Firebase Apple SDK with Swift Package Manager by default, which requires dynamic frameworks (`use_frameworks! :linkage => :dynamic`). Static frameworks require opting out of SPM. Follow the installation page for the version in `package.json`.
- Prefer the modular API (`getAuth()`, `onAuthStateChanged(getAuth(), ...)`) over the deprecated namespaced API (`auth().onAuthStateChanged(...)`), and match what the installed version documents.
- The Firebase JS SDK (the `firebase` npm package) is a different library. Do not mix it with React Native Firebase for the same product.

## Package

`@react-native-firebase/remote-config`

## Setup and fetch

```ts
import { getRemoteConfig, setConfigSettings, setDefaults, fetchAndActivate, getValue } from '@react-native-firebase/remote-config';

const remoteConfig = getRemoteConfig();

export async function initRemoteConfig() {
  await setConfigSettings(remoteConfig, { minimumFetchIntervalMillis: __DEV__ ? 0 : 3_600_000 });
  await setDefaults(remoteConfig, { show_new_checkout: false });
  await fetchAndActivate(remoteConfig);
}

export const showNewCheckout = () => getValue(remoteConfig, 'show_new_checkout').asBoolean();
```

- The React Native Firebase setting is in **milliseconds** (`minimumFetchIntervalMillis`), unlike the native SDKs.
- Ship defaults for every key; do not block the first screen on the fetch.
- Real-time updates are available through the config update listener; check its name and the unsubscribe it returns in the installed version's documentation.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
