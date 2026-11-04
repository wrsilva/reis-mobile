# React Native and Expo CI

Read the [React Native release reference](../../mobile-release/references/react-native.md).

- Restore JavaScript dependencies with the project's package manager and lock file, then run its existing static checks and tests. Resolve Node and native toolchain versions from project configuration.
- For native builds, use the [Android](android.md) and [iOS](ios.md) references. Keep the JavaScript bundle and source maps tied to the exact native artifact.
- For Expo, inspect EAS profiles and workflows before introducing fastlane. Preserve the team's build and submission ownership; do not add a second uploader alongside EAS Submit.
- Keep OTA publishing separate from binary submission and verify runtime compatibility and destination before execution. The imported iOS examples do not define EAS or Android lanes.
