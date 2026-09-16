# Debugging React Native apps

A React Native app fails in one of three layers: the JavaScript bundle (Metro), the native build (Gradle or Xcode), or at runtime. Find the layer before changing anything.

| Output contains | Layer | Next step |
|---|---|---|
| `Unable to resolve module`, `SyntaxError` in the bundle, Metro red screen before the app renders | Metro / JavaScript bundle | Section 2 |
| `FAILURE: Build failed with an exception`, `Execution failed for task` | Android build | [android.md](android.md) — run Gradle from `android/` |
| `pod install` errors, Xcode `error:` lines | iOS build | [ios.md](ios.md) — run pods from `ios/` |
| `TurboModuleRegistry.getEnforcing(...): 'X' could not be found`, `requireNativeComponent: 'X' was not found in the UIManager`, `The package 'X' doesn't seem to be linked` | Native module missing from the running binary | Section 3 |
| A red screen or LogBox error after the app renders | JavaScript runtime | Section 4 |

## 1. Versions

- `npx react-native info` (or `npx expo-doctor` in Expo projects): React Native, Node, Java, Xcode, CocoaPods and package versions in one place.
- React Native, the Expo SDK and native libraries must be versions that support each other; check each library's compatibility notes. After a React Native upgrade, compare native file changes with the React Native Upgrade Helper for the two versions.
- Check whether the New Architecture is enabled (`newArchEnabled` in `android/gradle.properties`, the Podfile or `app.json`) before debugging a native module: older libraries may not support it.

## 2. Metro and the JavaScript bundle

- `Unable to resolve module X` → the package is not installed, the import path is wrong, or Metro's cache is stale after installing. Check `package.json` and the path first; then restart Metro with a clean cache (`npx react-native start --reset-cache`, or `npx expo start -c`).
- Monorepos and symlinked packages need `watchFolders` and resolver settings in `metro.config.js`.
- `Invariant Violation: "main" has not been registered` → the bundle failed to load earlier (read the first error in the Metro terminal), or the name in `AppRegistry.registerComponent` differs from the native side.

## 3. Native module not found

The JavaScript side expects a native module that the installed binary does not contain.

- The app was not rebuilt after installing a library with native code: rebuild (`npx react-native run-android` / `run-ios`, or a new development build with Expo).
- Expo Go only contains the Expo SDK's modules; libraries with other native code need a development build.
- iOS: `pod install` did not run after installing the library.
- The library does not support the architecture the app runs (New Architecture vs legacy); check its documentation.

## 4. JavaScript runtime errors

- Read the component stack in LogBox, not only the message. `undefined is not an object (evaluating 'x.y')` and `Cannot read property 'y' of undefined` point to data that has not loaded yet or a changed API response; handle loading and error states.
- `Rendered more hooks than during the previous render` → a hook called conditionally.
- `Maximum update depth exceeded` → a state update inside render or an effect whose dependencies change on every render.
- Release-only crashes: stack traces from Hermes release bundles need the source maps of that build to map back to source files; check that source maps are generated and uploaded to the crash reporter. Also check `__DEV__`-only code and environment variables missing from the release configuration.

## Cleaning, with confirmation

These fix stale caches, not version conflicts. Propose them with what they delete, and run them only when the user agrees: restarting Metro with `--reset-cache`, `watchman watch-del-all`, deleting `node_modules` and reinstalling, `./gradlew clean` in `android/`, removing `ios/Pods` and running `pod install`. In Expo projects with Continuous Native Generation, `npx expo prebuild --clean` regenerates `android/` and `ios/` and discards manual native changes; confirm that the project does not rely on them first.
