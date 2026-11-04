# Android CI

Read the [shared pipeline guide](../../mobile-release/references/ci-cd.md) and [Android release reference](../../mobile-release/references/android.md).

- Resolve the Gradle wrapper, JDK, module, variant and signing configuration from the project. Run its existing lint and test tasks before the release bundle task.
- Keep the upload keystore and Play credentials in CI secrets; untrusted pull requests must not receive them. Preserve the distinction between the upload key and Play App Signing.
- Use the actual AAB path and package identifier in the Android lane. The imported iOS `gym`, `pilot`, `match` and `snapshot` examples do not implement Android builds or uploads.
- Upload through the project's fastlane Play lane with an explicit track and release status. Retain the exact AAB, mapping and native symbols. Coordinate version codes across concurrent runs and retries.
