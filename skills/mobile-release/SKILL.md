---
name: mobile-release
description: Prepares and checks mobile app releases on every stack — release readiness (go/no-go) checklist, version name and build number, signing, crash symbols (R8 mappings, dSYMs, Dart split debug info, JavaScript source maps), store requirements, staged rollout and rollback, release notes and store listing copy with the Google Play and App Store character limits, and CI/CD pipelines with GitHub Actions, fastlane and EAS — for Flutter, native Android, native iOS and React Native. Use when preparing a version for Google Play or the App Store, auditing whether a build is ready to ship, writing release notes or store descriptions from the git history, setting up or reviewing a build and deploy pipeline, or planning a rollout, even if the user only says "we ship on Friday".
intents: [release, deployment]
stacks: ["*"]
---

# Mobile Release

One release process for every mobile stack. This file holds the process and what is true everywhere; each platform's versioning, signing, symbols and store details live in its reference.

## 1. Pick the references

| Need | Read |
|---|---|
| Flutter app | [references/flutter.md](references/flutter.md) |
| Native Android, or the Android build of any app | [references/android.md](references/android.md) |
| Native iOS, or the iOS build of any app | [references/ios.md](references/ios.md) |
| React Native or Expo app | [references/react-native.md](references/react-native.md) |
| Release notes and store listing text | [references/store-copy.md](references/store-copy.md) |
| A CI/CD pipeline that builds, signs and uploads | [references/ci-cd.md](references/ci-cd.md) |

Flutter and React Native apps also need the Android and iOS references for signing and store details. Deeper platform guides live in the platform skills: Google Play policy and Play Billing in `mobile-android`, TestFlight and App Store Connect in `mobile-ios`, EAS in `mobile-rn`. Security hardening before release is in `mobile-security`.

## 2. Readiness checklist

Check each item against the project, not against memory. Mark each one **pass**, **fail** (with `file:line` or the missing artifact) or **unknown** (needs information only the team has, such as the store console state).

**Version**
- [ ] The version name follows the project's scheme and changed since the last release tag (`git describe --tags --abbrev=0`).
- [ ] The build number is higher than any build already uploaded. Both stores reject a build number they have seen.
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
- [ ] The release commit is tagged and the tag matches the version.

## 3. Report

```markdown
## Release readiness — <app> <version> (<build>)
Verdict: GO | GO WITH RISKS | NO-GO

### Blockers
- item — evidence (file:line or missing artifact) — fix

### Risks
- item — why it matters — mitigation

### Unknown
- item — who or what can confirm it

### Rollout plan
Stages, metrics to watch, halt threshold, rollback path.
```

A single blocker makes the verdict NO-GO. Do not bump versions, create tags, upload builds or change store settings unless the user asks; propose the exact commands instead.
