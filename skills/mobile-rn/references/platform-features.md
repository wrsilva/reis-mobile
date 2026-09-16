# React Native platform features

## Permissions

- Expo modules expose permission hooks and methods (`useCameraPermissions`, `Location.requestForegroundPermissionsAsync`...); bare projects often use `react-native-permissions`.
- Declare iOS usage descriptions and Android permissions in native config: in Expo, through the module's config plugin options or `ios.infoPlist` and `android.permissions` in the app config; in bare projects, in `Info.plist` and `AndroidManifest.xml`.
- Ask in context, handle "denied" and "blocked", and link to settings with `Linking.openSettings()`.

## Push notifications

- **Expo:** `expo-notifications` for permissions, tokens, foreground handling (`setNotificationHandler`) and taps; the Expo push service or your own backend with FCM/APNs credentials. Push does not work in Expo Go on every platform and SDK version; use a development build.
- **Firebase Cloud Messaging:** follow `mobile-firebase` (React Native Firebase).
- Android 13+ needs the notification permission; iOS needs the Push Notifications capability and an APNs key.
- Register background handlers at the app entry, outside components.

## Deep links

- Custom scheme: `scheme` in the Expo app config, or intent filters and URL types in bare projects.
- Universal links and app links: `ios.associatedDomains` and `android.intentFilters` with `autoVerify` in Expo, plus the `apple-app-site-association` and `assetlinks.json` files on your domain.
- Route links through the navigator's linking configuration and validate parameters before acting.

## Background work

- Periodic background work is limited and scheduled by the OS. In Expo, use the background task module of the SDK in use (`expo-background-task` replaced `expo-background-fetch`; check the SDK docs) with `expo-task-manager`.
- Uploads and long jobs that must finish belong on the server or in native background transfer APIs, not in JavaScript timers.

## Native modules and config

- **Expo Modules API:** write native modules in Swift and Kotlin with a typed JavaScript interface; works in Expo and bare projects.
- **Turbo Modules / Fabric components:** the New Architecture native module system in bare projects; define the spec in TypeScript and generate code with Codegen.
- **Config plugins:** change native projects (Info.plist, manifest, Gradle, Podfile) reproducibly in Expo projects with Continuous Native Generation. Do not hand-edit `android/` and `ios/` in such projects; changes are lost on `npx expo prebuild --clean`.
- Wrap each native module once in a typed TypeScript API.

## Device capabilities

Camera (`expo-camera` or `react-native-vision-camera`), location (`expo-location`), media library, biometrics (`expo-local-authentication`), haptics and sensors: prefer the libraries the project already uses, check that they support the New Architecture when it is enabled, and add their permissions.

## In-app purchases

Use a maintained library (for example RevenueCat's SDK or `react-native-iap`) or the store APIs through native modules; verify purchases and entitlements on a server, and test with store sandbox accounts. Store rules for digital goods are in `mobile-ios` and `mobile-android`.
