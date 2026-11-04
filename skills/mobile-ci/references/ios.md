# iOS CI

Read the [iOS release reference](../../mobile-release/references/ios.md) and choose the relevant [fastlane guide](../SKILL.md#choose-the-references).

- Resolve the workspace or project, shared scheme, target, configuration, bundle identifiers and team from the app. Pin the available Xcode and Ruby toolchain used by CI.
- Restore dependencies using the project's existing lock files before testing or archiving. Keep signing isolated to trusted jobs and preserve managed signing if already configured.
- Use [Match](fastlane/match.md) only when it fits the existing certificate strategy. Build lanes should consume signing assets read-only; provisioning is a separate operation.
- Distinguish [TestFlight upload](fastlane/beta.md), external distribution and [App Store review submission](fastlane/release.md). Bind each to the exact artifact and build number and retain matching dSYMs.
- For [Snapshot](fastlane/snapshot.md), verify the UI test scheme, available simulators and locales. Review generated screenshots before upload. For [Xcode Cloud](fastlane/xcode-cloud.md), inspect lifecycle scripts and existing archive/distribution steps before adding fastlane hooks.
