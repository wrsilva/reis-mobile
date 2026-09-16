# Firebase In-App Messaging — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Package

`@react-native-firebase/in-app-messaging` (with `@react-native-firebase/analytics`: campaigns are triggered by Analytics events)

## Usage

```ts
import { getInAppMessaging, setMessagesDisplaySuppressed, triggerEvent } from '@react-native-firebase/in-app-messaging';

await setMessagesDisplaySuppressed(getInAppMessaging(), true);   // during flows that must not be interrupted
await setMessagesDisplaySuppressed(getInAppMessaging(), false);
await triggerEvent(getInAppMessaging(), 'checkout_completed');
```

## Notes

- Messages use the native default display; the look is configured per campaign in the console.
- To preview a campaign on a device, use **Test on device** with the Firebase Installation ID (`@react-native-firebase/installations`).

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
