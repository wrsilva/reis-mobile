# Analytics in React Native and Expo

- Confirm the SDK in `package.json` and the native SDK it wraps. Native code can collect before the JavaScript bundle runs: configure collection defaults natively, through a config plugin or the native files, instead of in a `useEffect`.
- Track screen views from the navigation container: with React Navigation, compare routes in `onStateChange` through a navigation ref; with Expo Router, react to `usePathname` changes.
- Fire conversion events after the mutation resolves, not on press. React Strict Mode runs effects twice in development, so emit from the handler of the confirmed outcome rather than from a mount effect.
- Firebase screen views, consent flags and DebugView are in the [Firebase Analytics reference](../../mobile-firebase/references/react-native/analytics.md).
- Reset the analytics identity in the sign-out flow. Test the boundary in Jest with the SDK mocked, and confirm delivery on native builds.

Official references: [React Navigation screen tracking](https://reactnavigation.org/docs/screen-tracking/), [Expo Router screen tracking](https://docs.expo.dev/router/reference/screen-tracking/). Apply the [Android](android.md) and [iOS](ios.md) references to native collection settings.
