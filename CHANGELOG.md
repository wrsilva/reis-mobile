# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `/reis-mobile:debug` and `reis-mobile debug`: routes a build or runtime failure to the debug agent and skills, adds the doctor report, and answers with the cause, evidence, minimal fix and verification. It only changes the project after the user asks to apply the fix.
- Architect, performance and test agents for native Android (`android-*`), native iOS (`ios-*`) and React Native (`rn-*`), alongside the Flutter ones. `lead-mobile` and `/reis-mobile:debate` pick the specialists of the detected stack.
- Skills written for reis-mobile: `android-gradle-build-debug`, `ios-xcode-build-debug`, `ios-cocoapods-debug`, `flutter-build-debug`, `android-code-review` and `ios-code-review`.
- 24 skills from [android/skills](https://github.com/android/skills) (Apache-2.0), credited in `THIRD_PARTY_NOTICES.md`: `agp-9-upgrade`, `r8-analyzer`, `android-intent-security`, `android-profiler`, `testing-setup` and `play-policy-insights` are routed automatically; the others (Compose, navigation, Play, camera, media, identity, on-device AI, Wear, TV, XR and the Android CLI) are triggered by their description.
- `.reis-mobile/config.yaml` with `app: <folder>`, so every command analyzes the mobile app of a monorepo from anywhere in the repository.
- Skills can declare `areas` (`gradle`, `xcode`, `cocoapods`, `signing`, `pub`...). The router ranks the skill for the area detected in the prompt first among skills of the same stack.

### Changed

- The frontmatter parser joins descriptions continued on indented lines, as the imported skills write them.
- The package is larger (about 950 KB compressed) and the plugin's fixed context cost grows to about 9,500 tokens per session, since Claude Code loads every skill description.

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
