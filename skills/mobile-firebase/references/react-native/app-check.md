# Firebase App Check — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Package

`@react-native-firebase/app-check`

## Initialize early

```ts
import { getApp } from '@react-native-firebase/app';
import { initializeAppCheck, ReactNativeFirebaseAppCheckProvider } from '@react-native-firebase/app-check';

const provider = new ReactNativeFirebaseAppCheckProvider();
provider.configure({
  android: { provider: __DEV__ ? 'debug' : 'playIntegrity', debugToken: process.env.APP_CHECK_DEBUG_TOKEN },
  apple: { provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback', debugToken: process.env.APP_CHECK_DEBUG_TOKEN },
});

await initializeAppCheck(getApp(), { provider, isTokenAutoRefreshEnabled: true });
```

Run it before the first call to a protected product, and check the provider names against the installed version.

## Notes

- The native requirements still apply: the Play Console link for Play Integrity and the App Attest capability on iOS.
- Debug tokens are secrets for your project; keep them out of the repository and out of release builds.
- Watch the App Check metrics before turning on enforcement.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
