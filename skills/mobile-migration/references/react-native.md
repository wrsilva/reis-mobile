# Migrations in React Native and Expo

- Record React Native, the Expo SDK (`expo` package), Hermes and the native toolchains from `package.json`, the lockfile, `Podfile.lock` and Gradle files.
- Expo: upgrade one SDK version at a time following its release notes, run `npx expo install --fix` to align packages and `npx expo-doctor` to check the result. Regenerate native folders with prebuild when the project uses Continuous Native Generation.
- Bare React Native: diff the native template files between the two versions with [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/), apply the native changes, then the JavaScript changes.
- New Architecture: check each native library's support before enabling it, and read the target version's release notes for whether the legacy architecture can still be enabled.
- An over-the-air update cannot deliver a native change. Change `runtimeVersion` with the native layer, as the [release guide](../../mobile-rn/references/performance-release.md) describes, and make JavaScript data migrations read stores written by older bundles.
- Verify native builds on both platforms and an upgrade install from the previous store build.

Official references: [upgrading React Native](https://reactnative.dev/docs/upgrading), [upgrading the Expo SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/). Apply the [Android](android.md) and [iOS](ios.md) references to native data and toolchains.
