# Hardware in React Native and Expo

- Confirm the libraries in `package.json` (for example `expo-camera` or `react-native-vision-camera`, `expo-location`, `expo-sensors`, `expo-haptics`, a BLE or NFC library) and check their New Architecture support. The library choices and permission hooks are in the [platform guide](../../mobile-rn/references/platform-features.md).
- Libraries that Expo Go does not include need a development build. Declare permissions and usage strings through the library's config plugin or the native files.
- React Navigation keeps screens mounted after navigating away: pause the camera, scans and location watches with `useIsFocused` or `useFocusEffect`, and with `AppState` when the app goes to the background. VisionCamera exposes an `isActive` prop for this.
- Do not send frames to JavaScript one by one; use the library's native frame processing, such as VisionCamera frame processors.
- Remove every subscription and listener in the effect cleanup, and ignore callbacks that arrive after the owner unmounted.
- Test the state logic in Jest with the native module mocked, and hardware behavior on native builds with the [Android](android.md) and [iOS](ios.md) references.

Official references: [VisionCamera lifecycle](https://visioncamera.margelo.com/docs/lifecycle), [useIsFocused](https://reactnavigation.org/docs/use-is-focused/), [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/).
