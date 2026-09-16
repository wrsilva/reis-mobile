# Google Analytics for Firebase — React Native

Project setup shared by every Firebase product is in [../react-native.md](../react-native.md). The concepts in `SKILL.md` — security rules, App Check, environments, the Local Emulator Suite — apply here too.

## Package

`@react-native-firebase/analytics`

## Events

```ts
import { getAnalytics, logEvent, logScreenView } from '@react-native-firebase/analytics';

await logEvent(getAnalytics(), 'select_item', { item_id: item.id, item_name: item.name });
```

- Prefer recommended event names (`select_item`, `purchase`, `login`...) and parameters before custom ones.
- Never log personal data as parameters or user properties.

## Screens with React Navigation

```tsx
<NavigationContainer
  ref={navigationRef}
  onStateChange={async () => {
    const current = navigationRef.getCurrentRoute()?.name;
    if (current && current !== previousRouteName.current) {
      await logScreenView(getAnalytics(), { screen_name: current, screen_class: current });
    }
    previousRouteName.current = current;
  }}
>
```

## Notes

- iOS advertising identifier and consent-mode flags are native build options (Podfile variables, or the analytics config plugin with Expo); set them to match App Tracking Transparency usage.
- DebugView uses the native methods: `adb shell setprop debug.firebase.analytics.app <application-id>` on Android and the `-FIRDebugEnabled` launch argument on iOS.

## Verify

- Check the SDK version the project uses before relying on an API shown here; names occasionally change between major versions.
- Security rules and App Check are the real protection: anything in the app binary can be read or modified.
