---
name: mobile-ci
description: Sets up and reviews mobile CI/CD and fastlane automation across Flutter, Android, iOS, React Native and Kotlin Multiplatform. Use for Fastfile lanes, Match signing, TestFlight beta uploads, App Store submission, Snapshot screenshots, Xcode Cloud or build and deployment pipelines.
intents: [deployment]
stacks: ["*"]
---

# Mobile CI

Connect the app's existing build, test, signing and distribution steps into a reproducible pipeline. Use [mobile-release](../mobile-release/SKILL.md) for release readiness and rollout decisions.

## Choose the references

Load the app's stack reference, then only the fastlane guide needed for the task. Cross-platform apps also need the reference for each native target being shipped.

| Need | Read |
|---|---|
| Flutter | [references/flutter.md](references/flutter.md) |
| Android, including a cross-platform Android host | [references/android.md](references/android.md) |
| iOS, including a cross-platform iOS host | [references/ios.md](references/ios.md) |
| React Native or Expo | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |
| Pipeline jobs, caches, credentials and artifact retention | [Shared CI/CD guide](../mobile-release/references/ci-cd.md) |
| Initialize fastlane and define iOS lanes | [Setup](references/fastlane/setup-fastlane.md) |
| iOS certificates and provisioning profiles | [Match](references/fastlane/match.md) |
| TestFlight internal and external testing | [Beta](references/fastlane/beta.md) |
| App Store submission and metadata | [Release](references/fastlane/release.md) |
| Capture, frame and upload App Store screenshots | [Snapshot](references/fastlane/snapshot.md) |
| Xcode Cloud workflow integration | [Xcode Cloud](references/fastlane/xcode-cloud.md) |

## Workflow

1. Inspect existing workflows, Fastfile, Appfile, Matchfile, Gemfile.lock, platform lock files, schemes, flavors and environment configuration. Identify working directories and actual artifact paths before writing commands.
2. Establish the requested scope: pipeline setup, local verification, beta upload or production submission. Preserve existing lanes and signing conventions; do not replace the whole Fastfile with an example.
3. Separate validation from signed builds and uploads. Use pinned toolchains, lock-file-based caches, protected release jobs, secret storage and retained symbols as described in the shared CI/CD guide.
4. Adapt the selected reference to the detected platform. The imported fastlane guides describe iOS workflows; Android needs its own Gradle tasks, keystore and Play destination.
5. Check lane definitions, dependencies, action parameters and workflow syntax before execution. Run the project's relevant local checks, then report what was verified locally and what still needs a CI or store run. A configured pipeline is not evidence of a successful upload.

## Applying the upstream examples

The fastlane references preserve the instructions from `greenstevester/fastlane-skill`; their frontmatter was removed and the Xcode Cloud link relocated. Read them as examples, with these integration rules:

- Use the project's Ruby/Bundler/fastlane versions and `bundle exec fastlane` when a Gemfile exists. Verify compatibility from the lock file and current fastlane documentation rather than applying the upstream blanket claim about Bundler 4 or replacing the installation with Homebrew.
- Resolve `/setup-fastlane` and references to the `match`, `beta`, `release` and `snapshot` skills through the table above. These are references, not separately installed commands. Embedded `!` shell snippets and `${ARGUMENTS}` placeholders are upstream notation, not automatic preflight results.
- Inspect each lane before invoking it: the setup and Match examples define different `release` behavior. Confirm the exact tested build rather than submitting whichever build is newest. Existing session authorization determines whether builds, uploads, store submission or automatic release are in scope.
- Keep Match read-only in CI. Certificate revocation (`match nuke`), simulator erasure, package removal and screenshot-directory replacement are destructive recovery examples, not routine setup steps; diagnose first and require explicit authorization for those actions.
- Verify action options with the installed version's help or official documentation. In particular, check the `app_store_connect_api_key` action's content parameter rather than copying the Xcode Cloud example's `key:` blindly. Never print private keys or passwords.
- Confirm current screenshot dimensions and accepted devices with Apple's linked specifications and installed simulators. Treat processing/review times and StoreKit storefront behavior as claims to verify, not guarantees. Screenshot fixtures must represent the product accurately.
- The Xcode Cloud guide describes lifecycle scripts but does not ship them. Create or inspect those scripts for the actual project; do not assume the setup guide generated them. Follow the team's configured triggers and managed signing, and avoid rebuilding or uploading the same artifact twice.
