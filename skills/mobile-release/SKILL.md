---
name: mobile-release
description: Prepares mobile releases across Flutter, native Android, native iOS, React Native and Kotlin Multiplatform, including separate Android/iOS artifacts from a shared KMP revision. Covers versions, signing, symbols, store readiness, rollout, release notes and CI/CD. Use for release audits, store submission, build pipelines or rollout planning.
intents: [release, deployment]
stacks: ["*"]
---

# Mobile Release

One release process for every mobile stack. This file holds the process and what is true everywhere; each platform's versioning, signing, symbols and store details live in its reference.

## 1. Pick the references

| Need | Read |
|---|---|
| Evidence-backed readiness audit, verdict and report | [references/readiness.md](references/readiness.md) |
| Flutter app | [references/flutter.md](references/flutter.md) |
| Native Android, or the Android build of any app | [references/android.md](references/android.md) |
| Native iOS, or the iOS build of any app | [references/ios.md](references/ios.md) |
| React Native or Expo app | [references/react-native.md](references/react-native.md) |
| Kotlin Multiplatform shared module and both host apps | [references/kotlin-multiplatform.md](references/kotlin-multiplatform.md) |
| Release notes and store listing text | [references/store-copy.md](references/store-copy.md) |
| A CI/CD pipeline that builds, signs and uploads | [references/ci-cd.md](references/ci-cd.md) |

Flutter and React Native apps also need the Android and iOS references for signing and store details. Deeper platform guides live in the platform skills: Google Play policy and Play Billing in `mobile-android`, TestFlight and App Store Connect in `mobile-ios`, EAS in `mobile-rn`. Security hardening before release is in `mobile-security`.

## 2. Readiness checklist

For readiness audits, first follow [the readiness contract](references/readiness.md): resolve each artifact identity, collect per-target evidence and apply its required gates and deterministic verdict helper.

Check each item against the project, not against memory. For the readiness verdict, a missing artifact or unavailable check is **unknown**; use **fail** only for an observed failure with evidence. Record a source reference and next action for every gate.

**Version**
- [ ] The version name follows the app's actual versioning scheme and is verified in the artifact and applicable CI overrides.
- [ ] The build number satisfies the destination store’s numbering scope, verified against upload history: Android versionCode increases across tracks; iOS build numbers must be unused within the applicable version train. See the native references.
- [ ] Android, iOS and any cross-platform manifest (`pubspec.yaml`, `app.json`) agree on the version.

**Build quality**
- [ ] CI is green on the release commit: lint or analysis, tests, and a release build for each platform.
- [ ] The release build is the one tested: release configuration, production environment, real signing — not a debug build.
- [ ] No debug leftovers: logging of sensitive data, debug menus, test endpoints, `debuggable` or development entitlements, feature flags pointing at staging.
- [ ] Crash symbols for this exact build are uploaded or archived: R8 mapping, dSYMs, Dart debug info, JavaScript source maps.

**Store and compliance**
- [ ] The target SDK, minimum OS and build toolchain meet the store's current requirements. These change every year: tell the user to confirm them in the Play Console and Apple's upload requirements instead of stating dates from memory.
- [ ] New permissions, tracking or data collection are reflected in the Play Data safety form, the App Store privacy details, privacy manifests and the privacy policy.
- [ ] Reviewers can reach every feature: a demo account and notes for anything behind login, hardware or location.
- [ ] Release notes and, when features changed, screenshots and description are ready in every listed language.

**Rollout**
- [ ] Staged rollout (Play) or phased release (App Store) planned for updates, with the crash-free and ANR metrics to watch and the threshold that halts it.
- [ ] Rollback plan: stores do not roll back a binary. Halting a rollout stops new installs; users who updated need a new build with a higher build number, a server-side kill switch or a remote config flag. Know which one applies before shipping.
- [ ] The release commit is tagged and the tag matches the version, when this is the project's release convention.

## 3. Report

Use the [readiness report and decision rules](references/readiness.md#report). Any failed or unknown required gate means **NO-GO**. **GO WITH RISKS** requires all gates to pass with explicitly documented non-blocking risks; **GO** requires no outstanding risks.

Readiness audits inspect existing evidence without running builds/tests or modifying the app. Version bumps, tags, uploads and store changes follow the user's explicit execution scope and existing authorization.
