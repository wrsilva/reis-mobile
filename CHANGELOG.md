# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.7.3] - 2026-09-21

### Added

- `/reis-mobile:release [request]` and entry-command forwarding audit mobile store readiness with per-target identity, pass/fail/unknown evidence gates and GO/GO WITH RISKS/NO-GO verdicts. A packaged helper rejects incomplete evidence; audits remain read-only by default.
- `reis-mobile release` prepares routing, redacted git context, diagnostics and release references for all five stacks, including both native artifacts in cross-platform apps. A public Flutter sample audit demonstrates the report and external verification limits.

## [0.7.2] - 2026-09-18

### Added

- Kotlin Multiplatform architect, test and performance specialists, a `mobile-kmp` platform skill and focused KMP references in the eight cross-stack topic skills. Routing and coverage tests guard the new paths.
- `/reis-mobile:project [feature]` creates or refreshes a verified app object map in `.reis-mobile/project.md` while preserving team-authored product context.

### Changed

- Specialist guidance distinguishes configured shared source sets, Android/iOS host behavior and target-specific validation; the shared brief verifies profile paths and separates team knowledge from code evidence.

### Fixed

- Release automation opens a pull request for synchronized files instead of pushing directly to a protected `main` branch, and waits for those changes to merge before tagging and publishing.

## [0.7.1] - 2026-09-17

### Added

- A `SessionStart` hook for Claude Code and Codex that warns when the installed plugin is behind npm's latest release. It caches registry results for 24 hours, stays silent offline and can be disabled with `REIS_MOBILE_UPDATE_CHECK=0`.
- `reis-mobile update-check [--force]` for manually checking the CLI version.

### Changed

- `package.json` is the only editable version source. CI synchronizes the plugin manifests and the Release workflow tests, tags and publishes a new version after it reaches `main`.
- Version synchronization now promotes authored `[Unreleased]` notes to a dated changelog section and refreshes the README's latest-release summary without changing historical entries.

## [0.7.0] - 2026-09-17

### Added

- `/reis-mobile:test` and `reis-mobile test`: the slash command runs, writes, audits or fixes tests according to the request; the CLI supplies explicit test routing, resolved project directory, redacted change context and toolchain diagnostics without launching test runners.
- A shared project brief contract for all 18 specialists, with actual symbols and paths, acceptance criteria, constraints, validation commands and optional team knowledge in `.reis-mobile/project.md`.

### Changed

- Specialists now own distinct investigation steps and deliverables, reuse the project brief and load technical checklists from skills instead of repeating general instructions.
- Native testing guides discover Android modules, variants and instrumentation setup for Espresso, and Xcode workspaces, schemes, plans and destinations for XCTest/XCUITest. Both cover deterministic synchronization and honest execution reporting.

### Fixed

- `reis-mobile init` updates the Claude Code plugin when it is already installed. It used to run `claude plugin install`, which leaves an installed plugin untouched, so `npm update -g reis-mobile` followed by `init` kept Claude Code on the old version.

## [0.6.0] - 2026-09-16

### Added

- `mobile-accessibility-auditor` agent: audits UI on every stack for screen reader labels, roles and states, touch targets, text scaling, focus and announcements, with a severity-ranked report and fixes in each platform's API. The router sends `accessibility` to it instead of `mobile-staff-engineer`.
- `mobile-release-engineer` agent: release readiness with a go/no-go verdict, release notes and store copy from the git history, CI/CD pipelines, signing, crash symbols and staged rollout. The router sends `release` and `deployment` to it instead of `mobile-staff-engineer`.
- `mobile-accessibility` topic skill, with references for Flutter (Semantics and `meetsGuideline` checks), native Android (Compose semantics and Views, Espresso accessibility checks), native iOS (SwiftUI, UIKit, `performAccessibilityAudit`) and React Native.
- `mobile-release` topic skill: readiness checklist and report, references for Flutter, Android, iOS and React Native (versions, signing, symbols, store checks, rollout, over-the-air updates), release notes and store listing limits, and CI/CD with GitHub Actions, fastlane and EAS.
- `mobile-debug` guides for Android ANRs (thread states, locks, `ApplicationExitInfo`), Android memory leaks (LeakCanary traces, heap dumps) and deep links on every stack (App Links verification, Universal Links and the Apple CDN, cold-start routing).

### Changed

- `mobile-staff-engineer` no longer declares the `release`, `deployment` and `accessibility` intents.
- The plugin's fixed context cost rises to about 4,300 tokens per session.

## [0.5.0] - 2026-09-16

### Changed

- **Breaking:** the review skills are consolidated into `mobile-code-review`, with the review process in `SKILL.md` and a checklist per platform: Flutter (the former `flutter-code-review`, `flutter-widget-review`, `flutter-project-audit` and `flutter-dart-run-static-analysis`, in `references/flutter/`), native Android (the former `android-code-review`), native iOS (the former `ios-code-review`) and a new React Native checklist. `mobile-security-audit`, `android-intent-security` and `flutter-effective-dart` stay separate. A review request on a Flutter app loads 3 skills instead of 6.
- **Breaking:** the debugging skills are consolidated into `mobile-debug`, with the debugging process in `SKILL.md` and a guide per platform and layer: Flutter (the former `flutter-build-debug`, `flutter-errors`, `flutter-fix-layout-issues`, `flutter-dart-fix-runtime-errors` and `flutter-dart-resolve-package-conflicts`, in `references/flutter/`), Android (the former `android-gradle-build-debug`, plus runtime crashes, R8 retrace and ANRs), iOS (the former `ios-xcode-build-debug` and `ios-cocoapods-debug`, plus crash logs and sanitizers) and a new React Native guide (Metro, native modules not found, Hermes). `/reis-mobile:debug` passes the detected area so the skill opens the right guide.
- **Breaking:** the security skills are consolidated into `mobile-security` (the former `mobile-security-audit`), with the OWASP MASVS checks for every stack in `SKILL.md` and a checklist per platform: Flutter (with the former `flutter-secure-token-store` guide), Android (with the former `android-intent-security` guide, plus `PendingIntent`s, app links and `FLAG_SECURE`), iOS (Data Protection, Keychain accessibility, privacy manifests) and React Native (bundled environment variables, Hermes, signed over-the-air updates). The audit no longer treats `google-services.json` and `GoogleService-Info.plist` as secrets, in line with `mobile-firebase`.
- **Breaking:** every skill starts with `mobile-`, and there are 11: topic skills with a reference per platform (`mobile-architecture`, `mobile-code-review`, `mobile-debug`, `mobile-test`, `mobile-security`, `mobile-firebase`, `mobile-detect-stack`) and platform skills with what exists only on one stack (`mobile-flutter`, `mobile-android`, `mobile-ios`, `mobile-rn`). `reis-mobile validate` enforces both kinds.
- `mobile-architecture` replaces the Flutter architecture and state management skills (`flutter-app-architecture`, `flutter-architecture-feature-first`, `flutter-apply-architecture-best-practices`, `flutter-managing-state`, `flutter-bloc`, `flutter-riverpod`, `flutter-provider`, `flutter-change-notifier`, `flutter-login-usecase`) and adds architecture guides for Android, iOS and React Native.
- `mobile-flutter` holds the other Flutter skills, grouped by theme: UI and navigation, data, native code, performance, accessibility and i18n, Dart, and setup.
- `mobile-android` holds the 22 remaining guides from `android/skills`, grouped by theme, each as a folder with its references and scripts.
- New `mobile-ios` and `mobile-rn` skills with guides for UI and navigation, data and networking, platform features, and performance and release.
- The plugin's fixed context cost drops to about 3,900 tokens per session.
- The npm description and keywords, and the README introduction, name the stacks and tools people search for (Flutter, iOS, React Native, Claude Code, Codex, agent skills).

## [0.4.0] - 2026-09-16

### Added

- `/reis-mobile:debug` and `reis-mobile debug`: routes a build or runtime failure to the debug agent and skills, adds the doctor report, and answers with the cause, evidence, minimal fix and verification. It only changes the project after the user asks to apply the fix.
- Architect, performance and test agents for native Android (`android-*`), native iOS (`ios-*`) and React Native (`rn-*`), alongside the Flutter ones. `lead-mobile` and `/reis-mobile:debate` pick the specialists of the detected stack.
- Skills written for reis-mobile: `android-gradle-build-debug`, `ios-xcode-build-debug`, `ios-cocoapods-debug`, `flutter-build-debug`, `android-code-review` and `ios-code-review`.
- The skills from [android/skills](https://github.com/android/skills) (Apache-2.0), credited in `THIRD_PARTY_NOTICES.md`, prefixed with `android-`: `android-agp-9-upgrade`, `android-r8-analyzer`, `android-intent-security`, `android-profiler` and `android-play-policy-insights` are routed automatically, and `testing-setup` became part of `mobile-test`; the others (Compose, navigation, Play, camera, media, identity, on-device AI, Wear, TV, XR and the Android CLI) are triggered by their description.
- `.reis-mobile/config.yaml` with `app: <folder>`, so every command analyzes the mobile app of a monorepo from anywhere in the repository.
- Skills can declare `areas` (`gradle`, `xcode`, `cocoapods`, `signing`, `pub`...). The router ranks the skill for the area detected in the prompt first among skills of the same stack.

### Changed

- **Breaking:** every skill name starts with the prefix of its stack — `flutter-`, `android-`, `ios-`, `rn-` — or `mobile-` for stack-agnostic skills, and `reis-mobile validate` enforces it. Renamed from v0.3.6: `architecture-feature-first` → `flutter-architecture-feature-first`, `code-review` → `flutter-code-review`, `bloc` → `flutter-bloc`, `dart-3-updates` → `flutter-dart-3-updates`, `dart-fix-runtime-errors` → `flutter-dart-fix-runtime-errors`, `dart-resolve-package-conflicts` → `flutter-dart-resolve-package-conflicts`, `dart-run-static-analysis` → `flutter-dart-run-static-analysis`, `dart-use-pattern-matching` → `flutter-dart-use-pattern-matching`, `detect-mobile-stack` → `mobile-detect-stack`, `effective-dart` → `flutter-effective-dart`, `provider` → `flutter-provider`, `riverpod` → `flutter-riverpod`. Update any instruction that calls a skill by its old `reis-mobile:<name>`; `THIRD_PARTY_NOTICES.md` lists the upstream name of each renamed third-party skill.
- **Breaking:** the test skills are consolidated into one, `mobile-test`, with a guide per platform in `references/` — Flutter (the former `flutter-testing`, `flutter-dart-add-unit-test`, `flutter-add-widget-test`, `flutter-add-integration-test`, `flutter-patrol-e2e-testing`, `flutter-mocktail`, `flutter-mockito`, `flutter-dart-generate-test-mocks`, `flutter-dart-collect-coverage` and `flutter-dart-migrate-to-checks-package`), native Android (including the former `android-testing-setup`), and new guides for native iOS and React Native. A test request now loads one skill instead of up to nine.
- **Breaking:** the 14 Firebase skills (`firebase-auth`, `firebase-cloud-firestore`, `firebase-messaging`, `firebase-app-check`, `flutterfire-configure`...) are consolidated into `mobile-firebase`, which covers Flutter, native Android (Kotlin), native iOS (Swift) and React Native: a guide per platform with the shared setup, and a guide per product in each platform folder. SQL Connect (formerly Data Connect) documents that React Native has no SDK. The skill is triggered by its description, so security reviews of apps without Firebase no longer load it.
- New skills follow one pattern: a `mobile-<topic>` skill with `references/flutter.md`, `android.md`, `ios.md` and `react-native.md` for anything that exists on several platforms; stack-prefixed skills only for single-platform problems. Tests check the platform links and every relative link.
- The frontmatter parser joins descriptions continued on indented lines, as the imported skills write them.
- The package is larger (about 950 KB compressed) and the plugin's fixed context cost grows to about 8,400 tokens per session, since Claude Code loads every skill description.

### Fixed

- The `mobile-staff-engineer` description still had a Portuguese example.

## [0.3.6] - 2026-09-16

### Changed

- `reis-mobile init` installs the plugin in Claude Code **and Codex**, in whichever of the two is on the `PATH`, and reports each one as installed, skipped or failed. A failure in one tool does not stop the other. In Codex it adds the GitHub marketplace, refreshes its snapshot and adds `reis-mobile@reis-mobile`, which also fixes `plugin reis-mobile was not found in marketplace reis-mobile` on an outdated snapshot.
- `reis-mobile init --uninstall` removes the plugin and the marketplace from both tools, and only removes a Codex marketplace that is configured, since Codex treats removing a missing one as an error.
- `init` exits with an error when neither Claude Code nor Codex is found, without saving the language.
- The README uses `reis-mobile init eng` in its examples.

## [0.3.5] - 2026-09-16

### Changed

- reis-mobile now ships only as the Claude Code plugin, the Codex plugin and the `reis-mobile` npm package (`npx reis-mobile init`). The Homebrew formula and the `install.sh` / `install.ps1` installers are discontinued; the README explains how to remove them.
- Releases no longer attach a tarball, `SHA256SUMS` or a Homebrew formula. The release workflow can run twice for the same tag without failing: it skips a GitHub release or npm version that already exists.
- CI packs the npm package and installs it globally on Linux, macOS and Windows, replacing the installer tests.

### Fixed

- The npm package did not include `THIRD_PARTY_NOTICES.md`, which the licenses of the imported skills require. It now ships it, along with `CHANGELOG.md`.

## [0.3.4] - 2026-09-16

### Changed

- Back to the `reis-mobile` name everywhere: the CLI command is `reis-mobile` again and the plugin is `reis-mobile@reis-mobile`, with commands and agents under `/reis-mobile:*`. This reverts the renames from v0.3.2 and v0.3.3.
- `reis-mobile init` refreshes the marketplace, installs `reis-mobile@reis-mobile` and then removes `mobile@reis-mobile`; `init --uninstall` removes both.
- `install.sh` and `install.ps1` remove the `mobile` / `mobile.cmd` command created by v0.3.3, and can still install the v0.3.3 release.

## [0.3.3] - 2026-09-16

### Changed

- **Breaking:** the CLI command is now `mobile` instead of `reis-mobile` (`mobile init`, `mobile doctor`, `mobile --version`...), and the entry point moves to `bin/mobile.mjs`. The npm package, the Homebrew formula (`wrsilva/tap/reis-mobile`), the release assets, the `REIS_MOBILE_*` variables and the install and config folders keep the `reis-mobile` name.
- `install.sh` and `install.ps1` create `mobile` / `mobile.cmd` and remove the `reis-mobile` command they created before. They still install releases up to v0.3.2, which ship `bin/reis-mobile.mjs`.

### Fixed

- `lead-mobile` still told the model to address agents with the old `reis-mobile:` prefix.

## [0.3.2] - 2026-09-16

### Changed

- **Breaking:** the plugin is now called `mobile`, so commands and agents move from `/reis-mobile:*` and `reis-mobile:<agent>` to `/mobile:*` and `mobile:<agent>`, and the entry command from `/reis-mobile` to `/mobile`. The plugin id is `mobile@reis-mobile`. The CLI, the repository, the marketplace, the Homebrew formula and the `.reis-mobile/` folder keep the `reis-mobile` name.
- `reis-mobile init` refreshes the marketplace before installing and removes `reis-mobile@reis-mobile` once `mobile@reis-mobile` is installed; `init --uninstall` removes both.

## [0.3.1] - 2026-09-16

### Added

- Answer language: `reis-mobile init pt|en` and `reis-mobile lang [pt|en]` save the language the `/reis-mobile:*` commands answer in to `~/.config/reis-mobile/config.json`. `detect`, `doctor`, `route` and `review` report it as `Language`, and it can be overridden with `--lang` or `REIS_MOBILE_LANG`, which the installers also honor. `init --uninstall` removes the saved file.

### Changed

- All agents, skills, commands, documentation and GitHub templates are now written in English. Intent detection still accepts prompts in English and Portuguese.

## [0.3.0] - 2026-09-15

### Added

- `/reis-mobile:debate` command: structured debate between three specialists with conflicting priorities. Blind round 1 (avoids anchoring), round 2 rebutting specific points, and a final decision by `lead-mobile`. Flags `--rounds`, `--agents` and `--external`.
- Model-heterogeneous participants: the command assigns `opus` and `sonnet` by role, overriding the agents' `model: inherit`. Three instances of the same model share the same biases and converge for reasons unrelated to the question being debated; selection guarantees at least two distinct models.
- **Debate moderation** section in the `lead-mobile` agent: how to weigh evidence against position and close on a decision instead of a tie.
- `tests/commands.test.mjs`: validates the frontmatter of every command and ensures the agents and skills they reference actually exist — `validate` covered agents, skills and stacks, but not `commands/`.

### Security

- `/reis-mobile:debate --external` sends the debate context to the third-party `codex` and `gemini` CLIs. Without the flag, nothing leaves the session. Documented in README.md.

## [0.2.1] - 2026-09-15

### Added

- `/reis-mobile` command: entry point that lists the commands and forwards to `doctor`, `review` or, with a free-form request, to the agent and skills for the detected stack. It also appears in the VS Code extension command menu, which does not find `/reis-mobile:doctor` when typing only `/reis-mobile`.

## [0.2.0] - 2026-09-15

### Added

- Agents `flutter-architect`, `flutter-performance-engineer`, `flutter-test-engineer`, `mobile-staff-engineer`, `plugin-native-expert` and `lead-mobile`.
- 63 Flutter, Dart and Firebase skills: 25 from `flutter/skills`, 8 from `dart-lang/skills`, 28 from `evanca/flutter-ai-rules` and 2 original ones (`flutter-login-usecase`, `flutter-secure-token-store`).
- `THIRD_PARTY_NOTICES.md` with origin and license; frontmatter with `source` and `license` in third-party skills.
- Frontmatter parser with support for `|` and `>` blocks.

### Changed

- The router now finds an agent for `debug`, `test`, `architecture`, `performance` and the other intents, not only for `review`.
- `/reis-mobile:review` in Flutter projects also loads `code-review`, `effective-dart` and `dart-run-static-analysis`.

## [0.1.0] - 2026-09-15

### Added

- `reis-mobile` Claude Code plugin, with a local marketplace.
- Stack detector: Flutter (app and plugin), React Native (including Expo), Kotlin Multiplatform, native Android and iOS.
- Registries for stacks, agents and skills, with validation (`reis-mobile validate`).
- Intent detector in Portuguese and English, and intent + stack → agent + skills router.
- Context engine with working tree or range diff, lock files excluded and secrets masked.
- `/reis-mobile:doctor` and `reis-mobile doctor`.
- `/reis-mobile:review` and `reis-mobile review`.
- `mobile-code-reviewer` agent.
- Skills `flutter-project-audit`, `flutter-widget-review`, `mobile-security-audit` and `detect-mobile-stack`.
- `reis-mobile` CLI: `init`, `detect`, `doctor`, `route`, `review`, `agents`, `skills`, `stacks`, `validate`.
- `reis-mobile init`: registers (or removes, with `--uninstall`) the plugin in Claude Code.
- `install.sh` (macOS/Linux) and `install.ps1` (Windows) installers, with SHA-256 verification.
- Release workflow: tarball, `SHA256SUMS`, Homebrew formula and npm publishing.
- CI on GitHub Actions (Node 22 and 24, Ubuntu and macOS) and installer tests on Ubuntu, macOS and Windows.
