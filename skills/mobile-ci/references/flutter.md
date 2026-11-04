# Flutter CI

Read the [Flutter release reference](../../mobile-release/references/flutter.md) and the [shared pipeline guide](../../mobile-release/references/ci-cd.md).

- Resolve Flutter from the project's version manager or CI configuration, then restore dependencies from its lock file and run the existing analysis and test commands.
- Keep Flutter builds and fastlane lanes consistent about flavors, entry points, environment definitions and working directories. Decide which step owns the build so upload lanes do not build a second binary.
- Use the [Android](android.md) and [iOS](ios.md) references for their respective signing and upload jobs. Do not copy the imported native iOS scheme placeholders into a Flutter app without checking its actual scheme.
- Carry the chosen version and build number through to each artifact. Retain Dart debug information when used, together with Android mappings and iOS dSYMs.
