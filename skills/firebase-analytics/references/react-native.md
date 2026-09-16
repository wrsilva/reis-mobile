# Google Analytics for Firebase — React Native

Use this reference instead of the Dart code in `SKILL.md` when the project is a React Native or Expo app. The product concepts in `SKILL.md` — security rules, data modeling, error handling, testing with the Local Emulator Suite — still apply.

## Setup

- Use React Native Firebase: `@react-native-firebase/app` plus one package per product (below). Add `google-services.json` and `GoogleService-Info.plist` to the native projects, or reference them in the config plugins with Expo.
- Expo: React Native Firebase needs a development build with config plugins (`npx expo prebuild`); it does not run in Expo Go.
- iOS: on React Native 0.75+, React Native Firebase resolves the Firebase Apple SDK with Swift Package Manager by default, which requires dynamic frameworks (`use_frameworks! :linkage => :dynamic`). Static frameworks require opting out of SPM. Follow the installation page for the version in `package.json`.
- Prefer the modular API (`getAuth()`, `onAuthStateChanged(getAuth(), ...)`) over the deprecated namespaced API (`auth().onAuthStateChanged(...)`), and match what the installed version documents.
- The Firebase JS SDK (the `firebase` npm package) is a different library. Do not mix it with React Native Firebase for the same product.

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
- Keep Firebase security rules and App Check as the real protection: anything in the app binary can be read or modified.
