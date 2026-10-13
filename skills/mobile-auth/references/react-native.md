# Authentication in React Native and Expo

- Reuse the existing provider/auth library and secure native storage. Check callback schemes, app links and build configuration in both hosts, including Expo config plugins where used.
- In Expo, check the installed AuthSession/provider integration and test in a development build with the actual redirect. Do not assume Expo Go reproduces production schemes or native passkey support.
- Let the session owner coordinate refresh; a component remount must not start a second independent renewal. Abort or invalidate the old account's requests before clearing query caches and exposing another account.
- Native passkey APIs need a supported bridge and a server ceremony. JS token parsing or a biometric result cannot substitute for server verification.
- Test cancellation and linking conflicts in state logic, then callback routing and secure storage in a native build. Check startup before the navigation container becomes ready.

Official references: [Expo authentication](https://docs.expo.dev/guides/authentication/), [React Native security](https://reactnative.dev/docs/security). Reuse [Firebase Auth](../../mobile-firebase/references/react-native/auth.md) when that provider is installed.
