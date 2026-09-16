# Flutter Project Audit

Project health checklist. Every item must be confirmed by reading the cited file; do not report what you could not verify.

## 1. `pubspec.yaml` and dependencies

- [ ] `environment.sdk` with a lower bound compatible with the features used (records, patterns and sealed classes require Dart 3).
- [ ] Dependencies with caret constraints (`^x.y.z`). `any` or versions without an upper bound are a finding.
- [ ] `dependency_overrides` present without a comment justifying it: finding (it masks conflicts and tends to be forgotten).
- [ ] Dev packages (`build_runner`, `mocktail`, `flutter_lints`/`very_good_analysis`) in `dev_dependencies`, not in `dependencies`.
- [ ] Dependencies via `git:` or `path:` in a published app: confirm it is intentional and that the `ref` is pinned.
- [ ] `pubspec.lock` committed in **apps** (guarantees reproducible builds). In **packages/plugins**, committing it is optional.
- [ ] Discontinued or replaced packages: only report with evidence (`pub` warning, package README). Do not claim it from memory.

Useful command, if Flutter is available: `flutter pub outdated`.

## 2. Static analysis

- [ ] `analysis_options.yaml` exists and includes a lint set (`package:flutter_lints/flutter.yaml`, `package:lints/recommended.yaml` or `very_good_analysis`).
- [ ] Rules disabled in bulk (`ignore:` at the top of files, `// ignore_for_file:`) without justification.
- [ ] Generated files (`*.g.dart`, `*.freezed.dart`, `*.mocks.dart`) excluded from analysis and consistent with the annotations. Stale generated code is a build bug.

Useful command: `flutter analyze`.

## 3. Native configuration

**Android** (`android/app/build.gradle` or `build.gradle.kts`):
- [ ] `applicationId` is not the default `com.example.*` (the Play Store rejects it).
- [ ] `minSdk`/`targetSdk`/`compileSdk`: explicit values or `flutter.*`. An outdated `targetSdk` blocks publishing; confirm the current Play Store requirement before citing a number.
- [ ] The release `signingConfig` does not use the debug key; passwords come from `key.properties` outside version control.
- [ ] `minifyEnabled`/`shrinkResources` and ProGuard/R8 rules consistent with plugins that use reflection.

**iOS** (`ios/Runner.xcodeproj`, `ios/Podfile`, `ios/Runner/Info.plist`):
- [ ] `PRODUCT_BUNDLE_IDENTIFIER` is not `com.example.*`.
- [ ] The Podfile `platform :ios` aligned with the project's `IPHONEOS_DEPLOYMENT_TARGET`.
- [ ] Every permission used has its `NS*UsageDescription` with real text (empty or generic text causes App Store rejection).

## 4. Environments and flavors

- [ ] Environment URLs and keys are not hardcoded in `lib/`. The standard is `--dart-define`/`--dart-define-from-file` or flavors.
- [ ] Values passed via `--dart-define` **are not secret**: they end up in the binary. A private API key must never be in the app.
- [ ] Production `.env`, `key.properties`, `*.jks`, `*.keystore`, `google-services.json` and `GoogleService-Info.plist` files: check `.gitignore` and `git ls-files`.

## 5. Structure and architecture

- [ ] Consistent organization (feature-first or by layers). Mixing both without criteria is a maintainability finding.
- [ ] The UI does not call HTTP, the database or platform plugins directly; there is a data/repository layer.
- [ ] A single predominant state management approach (BLoC, Riverpod, Provider...). Several without reason is a finding.
- [ ] Centralized dependency injection (constructors, `get_it`, providers), without global singletons scattered around.

## 6. Tests and CI

- [ ] There is a `test/` folder with tests matching the business logic (not just the template's default `widget_test.dart`).
- [ ] If there is an `integration_test/`, it runs in CI.
- [ ] The pipeline (`.github/workflows`, `codemagic.yaml`, `bitrise.yml`...) runs at least `flutter analyze` and `flutter test`.

## Output

Report each finding in the matching section of the `mobile-code-reviewer` report (Architecture, Security, Maintainability...), with `file:line` and the proposed fix.
