# Firebase Cloud Messaging — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Package

`@react-native-firebase/messaging`

## Permission and token

```ts
import { getMessaging, requestPermission, getToken, onTokenRefresh, AuthorizationStatus } from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

async function registerForPush() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  const status = await requestPermission(getMessaging()); // iOS prompt; Android returns authorized
  if (status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL) {
    await sendTokenToBackend(await getToken(getMessaging()));
  }
}

onTokenRefresh(getMessaging(), sendTokenToBackend);
```

## Handlers

```ts
// index.js — register before AppRegistry.registerComponent, outside any component
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

setBackgroundMessageHandler(getMessaging(), async (message) => {
  // keep it short: the OS gives background handlers little time
});
```

- Foreground messages arrive in `onMessage(getMessaging(), handler)` and are **not** shown as notifications automatically; display them with a local notification library if needed.
- Notification taps: `getInitialNotification` (app opened from quit state) and `onNotificationOpenedApp` (from background).
- The native requirements still apply: the Push Notifications capability and APNs key on iOS, notification channels on Android.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
