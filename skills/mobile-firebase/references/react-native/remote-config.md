# Firebase Remote Config — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

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
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
