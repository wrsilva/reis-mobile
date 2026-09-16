# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project follows [Semantic Versioning](https://semver.org/).

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
