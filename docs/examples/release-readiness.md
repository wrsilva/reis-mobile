# Release readiness example: Flutter testing_app

Verdict: **NO-GO** for Android production and the iOS App Store. One observed configuration failure and 21 unknown required gates block release. This is a source-based audit example, not a claim that the upstream educational sample is intended for store publication.

Audited on **2026-09-21** using the [release workflow](../../commands/release.md). Request: “Audit readiness to publish this sample to Android production and the iOS App Store.” Web, macOS, Linux and Windows are excluded. No builds, tests, dependency installation, signing changes or uploads were performed.

## Release identity

Public source: [flutter/samples at `8a4cf1db16d52741f0e59e1bfe818723430c35bc`](https://github.com/flutter/samples/tree/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app). The inspected sparse checkout was clean, including untracked files (E1). Source paths below are relative to the sample repository root.

| Target | Configured ID | Variant/environment | Configured version/build | Revision | Artifact |
|---|---|---|---|---|---|
| Android / Play production | `dev.flutter.testing_app` (A) | `release`; production environment unverified | `1.0.0+1` (P); Gradle reads generated local properties (A) | `8a4cf1db16d52741f0e59e1bfe818723430c35bc` | No AAB supplied (E2) |
| iOS / App Store | `dev.flutter.testingApp` (I) | Runner / Release; production environment unverified | `1.0.0+1` (P, V); CI overrides unknown | `8a4cf1db16d52741f0e59e1bfe818723430c35bc` | No archive/IPA supplied (E2) |

Both native hosts exist. These are configured identities, not verified binary identities. A favorite-button action calls `Favorites.add/remove` (H), changes an in-memory list and notifies listeners (F); this observed data path does not establish complete privacy compliance.

## Gates

Each row was passed to the verdict helper with its status, evidence text and next action. No required gate was waived.

| Target | Gate | Status | Evidence / missing confirmation | Next action / owner |
|---|---|---|---|---|
| android:production | `identity` | unknown | P; A; I; E1; E2. Source identity known; production environment, overrides and binary provenance unavailable. | Release owner: provide intended environment, CI inputs and artifact digest tied to this revision. |
| android:production | `build` | unknown | E2; C. No release artifact/log supplied; CI script source is not an execution result. | CI owner: provide successful signed release job and artifact for this target/revision. |
| android:production | `tests` | unknown | T; C. Tests exist; no executed result, count, failures or skips supplied. | QA: provide unit/widget and target-device integration/performance results for this revision. |
| android:production | `analysis` | unknown | L; E2. Analysis configuration exists; no result supplied. | CI owner: provide analysis results for this revision and native-target checks required by policy. |
| android:production | `version` | unknown | P; A; V. Configured 1.0.0+1; binary values, prior release and upload history unavailable. | Release owner: reconcile artifact/CI versions and destination upload history. Verify versionCode across Play tracks. |
| android:production | `signing` | fail | S. Checked-in release build explicitly uses signingConfigs.debug. No artifact supplied to demonstrate an override. | Android release owner: replace debug release signing through authorized implementation; provide upload-key signed AAB verification. |
| android:production | `symbols` | unknown | E2. No exact-build symbol/archive evidence supplied. | CI owner: provide build-matched symbols and archive/upload evidence; justify any inapplicable symbol type. |
| android:production | `store` | unknown | O1; A. targetSdkVersion is delegated to Flutter; effective value, Play account and production eligibility unavailable. | Store owner: verify artifact SDK/toolchain and destination account, review and production eligibility. |
| android:production | `privacy` | unknown | P; M; V; F. Source declarations and in-memory favorites do not establish resolved SDK behavior or store disclosure agreement. | Privacy owner: reconcile resolved SDKs, packaged manifests/permissions, policy and both console disclosures. |
| android:production | `listing` | unknown | E2. Sample README/assets are not verified store metadata; locales and reviewer requirements unavailable. | Product/store owner: provide approved locales, metadata, screenshots, release notes and reviewer access. |
| android:production | `rollout` | unknown | E2. No accepted owner, stages, metrics, halt thresholds or recovery evidence supplied. | Release owner: approve distribution plan and verify halt/kill-switch/higher-build recovery path. |
| ios:app-store | `identity` | unknown | P; A; I; E1; E2. Source identity known; production environment, overrides and binary provenance unavailable. | Release owner: provide intended environment, CI inputs and artifact digest tied to this revision. |
| ios:app-store | `build` | unknown | E2; C. No release artifact/log supplied; CI script source is not an execution result. | CI owner: provide successful signed release job and artifact for this target/revision. |
| ios:app-store | `tests` | unknown | T; C. Tests exist; no executed result, count, failures or skips supplied. | QA: provide unit/widget and target-device integration/performance results for this revision. |
| ios:app-store | `analysis` | unknown | L; E2. Analysis configuration exists; no result supplied. | CI owner: provide analysis results for this revision and native-target checks required by policy. |
| ios:app-store | `version` | unknown | P; A; V. Configured 1.0.0+1; binary values, prior release and upload history unavailable. | Release owner: reconcile artifact/CI versions and destination upload history. Verify unused build number in the applicable App Store version train. |
| ios:app-store | `signing` | unknown | I. Team and bundle settings exist; no distribution archive/profile/signature verified. | iOS release owner: provide distribution-signed archive and profile/entitlement verification. |
| ios:app-store | `symbols` | unknown | D; E2. Release config requests dSYM; matching archive/UUID and retention/upload evidence unavailable. | CI owner: provide build-matched symbols and archive/upload evidence; justify any inapplicable symbol type. |
| ios:app-store | `store` | unknown | O2; E2. Actual archive Xcode/SDK, account and submission state unavailable. | Store owner: verify artifact SDK/toolchain and destination account, review and production eligibility. |
| ios:app-store | `privacy` | unknown | P; M; V; F. Source declarations and in-memory favorites do not establish resolved SDK behavior or store disclosure agreement. | Privacy owner: reconcile resolved SDKs, packaged manifests/permissions, policy and both console disclosures. |
| ios:app-store | `listing` | unknown | E2. Sample README/assets are not verified store metadata; locales and reviewer requirements unavailable. | Product/store owner: provide approved locales, metadata, screenshots, release notes and reviewer access. |
| ios:app-store | `rollout` | unknown | E2. No accepted owner, stages, metrics, halt thresholds or recovery evidence supplied. | Release owner: approve distribution plan and verify halt/kill-switch/higher-build recovery path. |

## Blockers, risks and unknowns

**Observed failure:** Android release signing is explicitly wired to the debug signing configuration (S). This is a source finding, not a claim that an inspected binary was rejected.

**Unverified required gates:** all ten remaining Android gates and all eleven iOS gates. Store history, distribution identity, CI results and binary provenance cannot be inferred from source. CI scripts show intent only; the Android script even references `test/perf_test_e2e.dart` (C), absent from the inspected sample. No CI failure was executed or inferred.

No separate non-blocking risks were accepted (`risks: []`). Required unknowns were not downgraded to risks. The sparse checkout is sufficient for the inspected source paths, not proof that unmaterialized monorepo projects can build.

## Next actions and rollout

1. Release owner confirms intended app ownership, identifiers, environment and destination history; Android owner addresses the observed debug signing configuration in separately authorized implementation.
2. CI/QA owners supply this revision’s signed native artifacts, complete build/analysis/test results, dependency inventory and matching symbols. Resolve the workspace and toolchain before executing prepared checks.
3. Store/privacy/product owners reconcile the binaries with current requirements, account state, disclosures and listing material. Re-run all gates against those artifacts.
4. Release owner approves stages, monitoring baseline, halt thresholds and recovery. No percentages or thresholds are asserted as accepted here. Determine whether this is a first publication or update before choosing Play staged rollout or Apple phased release. Halting distribution does not replace already installed binaries; recovery needs a verified kill switch or a new higher-build hotfix. Neither path was verified.

Prepared, **not executed**, from `testing_app` after workspace/dependency and device setup: `flutter analyze`, `flutter test`, and `flutter test integration_test -d <approved-device-id>` separately for Android and iOS. The README also describes a physical-device profile performance run (T); the exact supported command/toolchain must be reconciled before execution. No publish command was prepared.

## Evidence and execution record

Local checkout: `/tmp/reis-release-audit.ePc4FJ/samples`; app root: `testing_app`. Shell commands used `rtk proxy`; prefixes are omitted below for readability.

- Prepared the temporary sparse checkout with `git sparse-checkout set testing_app .github tool analysis_defaults`; no tracked source edits.
- Executed `git rev-parse HEAD` and `git status --porcelain=v1 --untracked-files=all`: revision above and empty status (E1).
- Executed `node /Users/fabricadesoftware1/projetos/reis-mobile/bin/reis-mobile.mjs release --dir /tmp/reis-release-audit.ePc4FJ/samples/testing_app -- 'Audit readiness to publish this sample to Android production and the iOS App Store.'`: exit 0; Flutter detected, Android/iOS focus, three release references, and explicit “readiness has not been evaluated.” Tool version probes are environment evidence only.
- Inspected source with `rg --files --hidden`, targeted `rg -n`, and line-numbered Python `Path.read_text()` output. Inspected app manifests, Gradle/Xcode configuration, source data path, tests, README, analysis configuration and repository CI scripts.
- E2: recursively inventoried `testing_app` with Python `Path.rglob` for `.aab`, `.ipa`, `.xcarchive`, `.dSYM`, `.symbols`, `.log` and `.xcprivacy`; no matches. No external artifact store, CI result log or authenticated store record was supplied/accessed. Missing local manifests alone do not establish missing packaged SDK manifests.
- Executed `node skills/mobile-release/scripts/verdict.mjs` in the plugin repository through Python `subprocess.run`, with JSON on stdin containing the exact 22 gate rows above and `risks: []`: exit 0, `NO-GO`, 22 blockers, 21 unknowns. Exit 0 means the evaluator ran successfully.
- The initial requested `provider_shopper` path was absent at this upstream revision. It was not treated as an app: repository tree inspection established the mismatch, and the actual `testing_app` was selected and context preparation repeated.

Public source references (immutable revision):

- **P:** [testing_app/pubspec.yaml:3](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app/pubspec.yaml#L3).
- **A:** [testing_app/android/app/build.gradle:45](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app/android/app/build.gradle#L45).
- **S:** [testing_app/android/app/build.gradle:56](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app/android/app/build.gradle#L56).
- **I:** [testing_app/ios/Runner.xcodeproj/project.pbxproj:558](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app/ios/Runner.xcodeproj/project.pbxproj#L558).
- **V:** [testing_app/ios/Runner/Info.plist:21](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app/ios/Runner/Info.plist#L21).
- **D:** [testing_app/ios/Runner.xcodeproj/project.pbxproj:513](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app/ios/Runner.xcodeproj/project.pbxproj#L513).
- **T:** [testing_app/README.md:19](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app/README.md#L19).
- **C:** [tool/android_ci_script.sh:71](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/tool/android_ci_script.sh#L71).
- **L:** [testing_app/analysis_options.yaml:1](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app/analysis_options.yaml#L1).
- **M:** [testing_app/android/app/src/main/AndroidManifest.xml:1](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app/android/app/src/main/AndroidManifest.xml#L1).
- **F:** [testing_app/lib/models/favorites.dart:13](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app/lib/models/favorites.dart#L13).
- **H:** [testing_app/lib/screens/home.dart:62](https://github.com/flutter/samples/blob/8a4cf1db16d52741f0e59e1bfe818723430c35bc/testing_app/lib/screens/home.dart#L62).

- **O1:** [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878), accessed 2026-09-21: the page requires API 36 for new phone/tablet submissions and updates from 2026-08-31. No applicable extension or console eligibility was verified.
- **O2:** [Apple upcoming requirements](https://developer.apple.com/news/upcoming-requirements/), accessed 2026-09-21: uploads require Xcode 26 or later with the applicable iOS 26 SDK since 2026-04-28. The inspected source and local Xcode version do not prove the archive’s build toolchain.
