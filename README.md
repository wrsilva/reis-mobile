# 📱 reis-mobile

A mobile app is not a generic project. A code review that does not know about `BuildContext` after `await`, `android:exported`, `NSAllowsArbitraryLoads` or `Podfile.lock` lets through exactly the bugs that only show up on the device. **reis-mobile** detects your project's stack, picks the right specialist and loads only the skills that apply to Flutter, Android, iOS or React Native.

**AI agents for mobile engineering.** A Claude Code plugin with agents, skills and workflows specialized in mobile development.

<p align="center">
  <a href="https://github.com/wrsilva/reis-mobile/actions/workflows/ci.yml"><img src="https://github.com/wrsilva/reis-mobile/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/Version-0.3.4-blue" alt="Version 0.3.4">
  <img src="https://img.shields.io/badge/Claude_Code-plugin-blueviolet" alt="Claude Code plugin">
  <img src="https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white" alt="Node.js 22+">
  <img src="https://img.shields.io/badge/Dependencies-0-brightgreen" alt="Zero dependencies">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Flutter-02569B?logo=flutter&logoColor=white" alt="Flutter">
  <img src="https://img.shields.io/badge/Android-3DDC84?logo=android&logoColor=white" alt="Android">
  <img src="https://img.shields.io/badge/iOS-000000?logo=apple&logoColor=white" alt="iOS">
  <img src="https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB" alt="React Native">
  <img src="https://img.shields.io/badge/Kotlin_Multiplatform-7F52FF?logo=kotlin&logoColor=white" alt="Kotlin Multiplatform">
</p>

🔎 **Detects the stack on its own.** Flutter (app or plugin), React Native (including Expo), Kotlin Multiplatform, native Android and iOS, with languages and target platforms. A Flutter app with `android/` and `ios/` is still Flutter.

👥 **7 agents and 67 mobile skills.** Flutter architect, performance and test engineers, Flutter/Android/iOS staff engineer, native plugin specialist, code reviewer and a lead that coordinates them all, plus skills for BLoC, Riverpod, Firebase, testing, layout, plugins and security.

🌐 **Answers in English or Portuguese.** `reis-mobile init pt` or `reis-mobile init en` sets the language of reports, explanations and debates.

🧭 **Routes to the right specialist.** Describe the problem in English or Portuguese, and the router identifies the intent, the stack and the platform in focus. "The Android build of my Flutter app broke" loads Flutter **and** Android context.

🛡️ **Real mobile security.** Checklist based on OWASP MASVS, with concrete per-stack checks: `flutter_secure_storage`, `network_security_config`, ATS, Keychain and `AsyncStorage`.

🩺 **A doctor that understands mobile.** Checks Flutter, Dart, Java, Android SDK, Xcode, CocoaPods, Gradle wrapper and lock files, but only what matters for the detected stack.

🔒 **Secrets never reach the model.** The diff sent for review goes through a layer that masks API keys, tokens, JWTs, private keys and keystore passwords.

🪶 **No dependencies.** Installs with one command, zero npm dependencies, no hooks, no external provider.

---

## What's new

> 🆕 **v0.3.0: the specialists debate.** On an architecture decision, a single specialist gives you the answer of their specialty. `/reis-mobile:debate` puts three of them to defend incompatible positions on the same question — and `lead-mobile` decides, instead of listing pros and cons.
>
> ```bash
> /reis-mobile:debate Riverpod or BLoC for this app's state?
> /reis-mobile:debate --rounds 3 offline-first with Firestore or a local cache?
> ```
>
> Round 1 is blind, so nobody anchors the others. Participants do not vary only in role: they vary in model, because three instances of the same model agree for the same wrong reasons.

| Version | Highlights |
|--------|-----------|
| **v0.3.4** (current) | Back to the `reis-mobile` name: `reis-mobile` CLI and `/reis-mobile:*` commands, undoing the `mobile` renames of v0.3.2 and v0.3.3. |
| **v0.3.1** | Answers in English or Portuguese: `reis-mobile init pt\|en` and `reis-mobile lang` save the language for reports, doctor explanations and debates. Agents, skills, commands and docs are now written in English. |
| **v0.3.0** | `/reis-mobile:debate` command: three specialists with conflicting priorities debate over two rounds and `lead-mobile` decides. Participants vary in role and model; `--external` adds Codex and Gemini. Brings forward the `council` planned for v0.8.0. |
| **v0.2.1** | `/reis-mobile` command: lists the commands and forwards to `doctor`, `review` or, with a free-form request, to the agent and skills for the detected stack. Shows up in the VS Code extension command menu. |
| **v0.2.0** | 6 new agents (`flutter-architect`, `flutter-performance-engineer`, `flutter-test-engineer`, `mobile-staff-engineer`, `plugin-native-expert`, `lead-mobile`) and 63 new Flutter, Dart and Firebase skills. The router now has a specialist for debug, test, architecture and performance. |
| **v0.1.0** | `reis-mobile` plugin for Claude Code. Detection of 5 stacks. Intent + stack → agent + skills router. Context engine with masked diff. `/reis-mobile:doctor` and `/reis-mobile:review`. `reis-mobile` CLI. |

[Full changelog →](CHANGELOG.md)

## Installation

Requirements: **Node.js 22+** and, to use the `/reis-mobile:*` commands, **[Claude Code](https://claude.com/claude-code)**.

The installers and Homebrew install the `reis-mobile` CLI. When Claude Code is available, the installer also registers the plugin. If it is not, run `reis-mobile init` after installing it. To install only the plugin, follow the [Claude Code](#claude-code-plugin-only) or [Codex](#codex-plugin-from-github) section.

### Quick Install (macOS/Linux) — recommended

```bash
curl -fsSL https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.sh | sh
```

Installs to `~/.local/share/reis-mobile`, creates the command in `~/.local/bin` and checks the download's SHA-256. If `~/.local/bin` is not on your `PATH`:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc   # or ~/.bashrc
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.ps1 | iex
```

Installs to `%LOCALAPPDATA%\reis-mobile`, creates `reis-mobile.cmd` in `%USERPROFILE%\.local\bin` and adds that folder to the user `PATH`. Open a new terminal afterwards.

### Homebrew

```bash
brew install wrsilva/tap/reis-mobile
reis-mobile init
```

### npm (coming soon)

The package has not been published to npm yet. Once it is:

```bash
npm install -g reis-mobile
reis-mobile init
```

### Claude Code plugin only

```bash
claude plugin marketplace add https://github.com/wrsilva/reis-mobile.git
claude plugin install reis-mobile@reis-mobile
```

### Codex plugin from GitHub

With the Codex CLI installed and supporting `codex plugin`, run in the terminal:

```bash
codex plugin marketplace add https://github.com/wrsilva/reis-mobile.git
codex plugin add reis-mobile@reis-mobile
```

The first command registers the marketplace with GitHub as its source; the second installs the plugin into the Codex cache. It is the same repository used by Claude Code, with no need for a development clone or links in `~/.agents/skills/`. Installing plugin `0.2.1` through this flow has been verified.

Check the source, the installation and whether the plugin is enabled:

```bash
codex plugin marketplace list --json
codex plugin list --json
```

Look for `reis-mobile@reis-mobile` with `installed: true`, `enabled: true` and the Git source `https://github.com/wrsilva/reis-mobile.git`.

Restart Codex and open a conversation in your mobile app folder. In the CLI or the IDE extension, type `$` in the message field to search for skills, or use `/skills`. See the [official Codex skills documentation](https://learn.chatgpt.com/docs/build-skills#how-chatgpt-and-codex-use-skills).

Registering the plugin and the availability of each feature are separate checks: the installation validated above does not confirm that the agents or the Claude Code `/reis-mobile:*` commands run in Codex. To use `doctor`, `route` and `review` through the CLI, also install `reis-mobile` with one of the methods above and run it in the app folder:

```bash
reis-mobile doctor
reis-mobile route "review architecture" --json
reis-mobile review --json
```

You can also ask Codex: *"Run `reis-mobile review --json`, read the instructions in the returned files and review the changes using that context."* The CLI selects the instructions and gathers the context; Codex does the analysis.

`reis-mobile init` registers the plugin in Claude Code. To register it in Codex, use the `codex plugin` commands in this section, even if the `reis-mobile` CLI is already installed through Homebrew.

### Language

Agents, skills and commands are written in English, and that does not change. What you choose is the language reis-mobile **answers** in: `/reis-mobile:review` reports, `/reis-mobile:doctor` explanations, and debate rounds and syntheses.

```bash
reis-mobile init pt          # install the plugin and answer in Brazilian Portuguese
reis-mobile init en          # install the plugin and answer in English (also: eng)
reis-mobile lang pt          # change the language later, without reinstalling
reis-mobile lang             # show the current language
```

With the installers, pass it through the environment: `curl -fsSL .../install.sh | REIS_MOBILE_LANG=pt sh`.

The choice is saved to `~/.config/reis-mobile/config.json` (`%APPDATA%\reis-mobile\config.json` on Windows), so it survives `claude plugin update`. Precedence is `--lang` on a single run, then the `REIS_MOBILE_LANG` environment variable, then the saved file. With nothing set, each command answers in the language of your request. Agents that Claude Code triggers on its own, outside a `/reis-mobile:*` command, follow the language of the conversation.

### Verify the CLI and the Claude Code plugin

```bash
reis-mobile --version   # reis-mobile 0.2.1
```

Then restart Claude Code and run, in your app folder:

```text
/reis-mobile
/reis-mobile:doctor
/reis-mobile:review
```

<details>
<summary>Installer options</summary>

| Variable | Default | Use |
|----------|--------|-----|
| `REIS_MOBILE_VERSION` | latest release | Installs a specific tag, for example `v0.3.4` |
| `REIS_MOBILE_HOME` | `~/.local/share/reis-mobile` | Installation folder |
| `REIS_MOBILE_BIN_DIR` | `~/.local/bin` | Folder for the `reis-mobile` command |
| `REIS_MOBILE_SKIP_PLUGIN` | `0` | `1` installs only the CLI, without registering the plugin |
| `REIS_MOBILE_LANG` | not set | `en` or `pt`: the language the commands answer in (see [Language](#language)) |

```bash
curl -fsSL https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.sh | REIS_MOBILE_VERSION=v0.3.4 sh
```
</details>

<details>
<summary>Uninstall</summary>

Remove the Claude Code plugin first and then the CLI, using the same method used to install it.

```bash
# Claude Code plugin and saved language (any platform)
reis-mobile init --uninstall
# or, without the CLI:
claude plugin uninstall reis-mobile && claude plugin marketplace remove reis-mobile

# macOS/Linux (curl)
rm -rf ~/.local/share/reis-mobile ~/.local/bin/reis-mobile

# Homebrew
brew uninstall reis-mobile
brew untap wrsilva/tap            # optional
```

```powershell
# Windows (PowerShell)
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\reis-mobile"
Remove-Item -Force "$HOME\.local\bin\reis-mobile.cmd"
```
</details>

<details>
<summary>Development from the clone</summary>

```bash
git clone https://github.com/wrsilva/reis-mobile.git
cd reis-mobile
npm link                      # CLI pointing at the clone
reis-mobile init --local      # plugin pointing at the clone
npm run check                 # validates and runs the tests
```

After editing agents, skills or commands, restart the Claude Code session.
</details>

---

## Updating

reis-mobile has two parts that update separately: the **Claude Code plugin** (agents, skills and `/reis-mobile:*` commands) and the **CLI** (`reis-mobile`). Update both.

To see what changed, check the [CHANGELOG](CHANGELOG.md) or the [releases](https://github.com/wrsilva/reis-mobile/releases).

### Claude Code plugin (all platforms)

```bash
claude plugin marketplace update reis-mobile
claude plugin update reis-mobile@reis-mobile
```

Then **restart Claude Code**. The update only happens when a new version is out; if you are already on the latest, the command answers `already at the latest version`.

> **Installed v0.3.2 or v0.3.3?** Those versions renamed the plugin and the CLI to `mobile`; v0.3.4 goes back to `reis-mobile`. Update the CLI (`brew upgrade reis-mobile` or the installer, which remove the `mobile` command) and run `reis-mobile init`: it installs `reis-mobile@reis-mobile` and removes `mobile@reis-mobile`. In Codex: `codex plugin marketplace upgrade reis-mobile`, `codex plugin add reis-mobile@reis-mobile` and `codex plugin remove mobile@reis-mobile`.

### CLI on macOS/Linux (curl)

Run the installer again. It downloads the latest release, checks the SHA-256 and replaces the previous version:

```bash
curl -fsSL https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.sh | sh
```

To install a specific version:

```bash
curl -fsSL https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.sh | REIS_MOBILE_VERSION=v0.3.4 sh
```

### CLI on Windows (PowerShell)

Run the installer again:

```powershell
irm https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.ps1 | iex
```

For a specific version:

```powershell
$env:REIS_MOBILE_VERSION = 'v0.3.4'; irm https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.ps1 | iex
```

### CLI via Homebrew (macOS/Linux)

```bash
brew update
brew upgrade reis-mobile
```

### CLI via npm (coming soon)

Available once the package is published to npm:

```bash
npm update -g reis-mobile
```

### Check the versions

```bash
reis-mobile --version                  # CLI
claude plugin list | grep -A1 reis-mobile  # plugin
```

Both should show the same version.

<details>
<summary>Update troubleshooting</summary>

| Symptom | Solution |
|---------|---------|
| `claude plugin update` says it is already on the latest version, but the release is newer | Run `claude plugin marketplace update reis-mobile` before `update` |
| New agents or skills do not show up | Restart Claude Code: plugins only reload in a new session |
| `brew upgrade` does not find the new version | Run `brew update` first; the tap formula is updated right after each release |
| `reis-mobile --version` is still old after curl | Another `reis-mobile` comes first on the `PATH`; check with `which -a reis-mobile` |
| Windows is still on the old version | Open a new terminal and check with `where.exe reis-mobile` |
| Plugin broken after updating | Reinstall: `reis-mobile init --uninstall` and then `reis-mobile init` |

</details>

---

## Commands

```bash
/reis-mobile                                      # Lists the commands (entry point; also accepts doctor, review or a free-form request)
/reis-mobile my android build fails on gradle     # Free-form request: detects the stack and applies the right agent and skills
/reis-mobile:doctor                               # Environment and project: SDKs, Xcode, CocoaPods, Gradle wrapper, lock files
/reis-mobile:doctor --all                         # Checks every tool, not only those for the detected stack
/reis-mobile:review                               # Reviews uncommitted changes (or the whole project, if there are none)
/reis-mobile:review --base main                   # Reviews the current branch against main, pull request style
/reis-mobile:review --base main focus on security # Free-form focus, in English or Portuguese
/reis-mobile:debate Riverpod or BLoC in this app? # Debate between the specialists, with a decision by lead-mobile
/reis-mobile:debate --rounds 3 --external ...     # More rounds; --external adds Codex and Gemini, if installed
```

### Debate

`/reis-mobile:debate` puts three specialists with conflicting priorities to defend positions on the same question. Round 1 is blind, so the first to answer does not anchor the others; in round 2 each one rebuts specific points from the others; at the end, `lead-mobile` decides and delivers the action plan. The rounds are stored in `.reis-mobile/debates/`.

Participants vary along two axes at once. The **role** gives each one a different incentive: `flutter-architect` defends layer boundaries, `flutter-performance-engineer` is hostile to indirection, `flutter-test-engineer` wants injection seams the other two consider noise. The **model** keeps that disagreement from staying on the surface — the command spreads `opus` and `sonnet` across the participants, because three instances of the same model inherit the same blind spots and tend to converge for reasons that have nothing to do with your question. With `--external`, a third axis comes in: outside **providers**, in separate processes.

It is expensive: several agents over two rounds. Use it for architecture decisions with a real trade-off — *migrate to Riverpod*, *offline-first with Firestore or a local cache*, *native plugin or an off-the-shelf package* — and not for questions with a single answer, where `/reis-mobile <request>` solves it for less.

With `--external`, the command checks whether the `codex` and `gemini` CLIs exist and carries on without them if they are missing. External providers do not know the project and do not have the plugin skills: they come in as an outside opinion, checked against the code before the synthesis.

Not sure what the router will pick? Ask the CLI:

```text
$ reis-mobile route "Execution failed for task ':app:compileDebugKotlin'"
Intent      debug (confidence 0.5) · area gradle
Stack       flutter · focus android
Agent       mobile-staff-engineer
Skills      dart-fix-runtime-errors, dart-resolve-package-conflicts, flutter-errors, flutter-fix-layout-issues

$ reis-mobile route "write tests for the login cubit"
Intent      test (confidence 1)
Stack       flutter
Agent       flutter-test-engineer
Skills      dart-add-unit-test, dart-collect-coverage, dart-generate-test-mocks, flutter-add-integration-test, flutter-add-widget-test, mockito, mocktail, patrol-e2e-testing, testing
```

The router never invents a specialist: if no agent serves the intent, it warns you. You do not need to call agents by name, because Claude Code triggers them by their description when the request fits. To force one of them, ask: *"use reis-mobile:flutter-architect to review the architecture"*.

---

## Choose by goal

| I want to... | Use | Status |
|----------|-----|--------|
| Know if my environment is ready to build | `/reis-mobile:doctor` | ✅ |
| Review a PR or my changes | `/reis-mobile:review` | ✅ |
| Audit an entire Flutter project | `/reis-mobile:review` with no pending changes | ✅ |
| Find out a project's stack | `reis-mobile detect` | ✅ |
| Review the architecture of a Flutter app | agent `flutter-architect` | ✅ |
| Find the cause of jank, rebuilds or leaks | agent `flutter-performance-engineer` | ✅ |
| Write or audit Flutter tests | agent `flutter-test-engineer` | ✅ |
| Debug a Gradle, Xcode or CocoaPods build | agent `mobile-staff-engineer` | ✅ |
| Build a plugin or debug MethodChannel/EventChannel | agent `plugin-native-expert` | ✅ |
| Full audit with several specialists | agent `lead-mobile` | ✅ |
| Decide between two architectures with a real trade-off | `/reis-mobile:debate` | ✅ |
| Dedicated debug command | `/reis-mobile:debug` | 🔜 v0.4 |
| Dedicated test command (including XCTest and Espresso) | `/reis-mobile:test` | 🔜 v0.4 |
| Check whether the app is ready for the store | `/reis-mobile:release` | 🔜 v0.5 |
| Consolidated decision by consensus between agents | `/reis-mobile:council` | 🔜 v0.8 |

<details>
<summary><strong>How is it different from plain Claude Code?</strong></summary>

| | Plain Claude Code | reis-mobile |
|---|---|---|
| **Domain** | Generic | Flutter, Android, iOS, React Native, KMP |
| **Project context** | You explain the stack | Deterministic detection of stack, platform and variant |
| **Review** | Generic | Mobile checklists: lifecycle, `BuildContext`, MASVS, manifest, ATS |
| **Secrets in the diff** | Sent as they are | Masked before reaching the model |
| **Specialists** | None | 7 agents and 67 mobile skills |
| **Context cost** | Zero | ~4,800 fixed tokens (agent and skill descriptions), no hooks |
| **Best for** | General tasks | Teams and developers working on mobile apps |

**In short:** Claude Code already knows how to code. reis-mobile makes it look at what matters in a mobile app.

</details>

---

## How it works

```text
/reis-mobile:review
     │
     ├─ detect stack ──────── pubspec.yaml → flutter (android, ios)
     ├─ detect intent ─────── review
     ├─ select agent ──────── mobile-code-reviewer
     ├─ select skills ─────── code-review · effective-dart · flutter-project-audit · flutter-widget-review · mobile-security-audit …
     ├─ collect context ───── git diff (lock files out, secrets masked)
     └─ review report ─────── Summary · Critical · Bugs · Architecture · Security · Performance · Maintainability
```

The Node.js core decides **what** to load. The model decides **how** to review, following the loaded instructions. Details in [ARCHITECTURE.md](ARCHITECTURE.md).

### Stack detection

| Stack | Evidence |
|-------|-----------|
| Flutter | `pubspec.yaml` with `sdk: flutter` (`plugin` variant when applicable) |
| React Native | `package.json` depending on `react-native` (`expo` variant) |
| Kotlin Multiplatform | `build.gradle.kts` with the multiplatform plugin |
| Android | Gradle at the root + `AndroidManifest.xml` or a `com.android.*` plugin |
| iOS | `*.xcodeproj`, `*.xcworkspace`, `Podfile` or `Package.swift` with `.iOS` |

### Agents

| Agent | Stack | Triggered for | What it does |
|-------|-------|---------------|-----------|
| `mobile-code-reviewer` | all | review | Review with `file:line` evidence, focused on what breaks in production |
| `flutter-architect` | Flutter | architecture | Layers, feature-first, coupling, misplaced logic, refactoring plan |
| `flutter-performance-engineer` | Flutter | performance | Rebuilds, jank, lists, leaks, paint, startup, with a score and top 3 fixes |
| `flutter-test-engineer` | Flutter | test | Unit, BLoC/Cubit, widget and integration, coverage audit and fragile tests |
| `mobile-staff-engineer` | all | debug, architecture, performance, test, security, release, migration, dependency, build, deployment, accessibility | Senior Flutter/Android/iOS specialist for whatever no specific agent covers |
| `plugin-native-expert` | Flutter | on demand | MethodChannel, EventChannel, Pigeon and Kotlin/Swift bridges, threading and lifecycle |
| `lead-mobile` | all | on demand | Coordinates the other agents and consolidates a single action plan |

When more than one agent serves the intent, the stack-specific one wins. In a Flutter app, `performance` goes to `flutter-performance-engineer`; in a native Android app, it goes to `mobile-staff-engineer`.

### Skills

**Auto-routed** skills are loaded by the router together with the agent. The others (—) are triggered by Claude Code when the request matches the description, for example *"add push notifications with FCM"* → `firebase-messaging`.

<details>
<summary><strong>Review and quality</strong> (7)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `code-review` | Performs thorough code reviews for Flutter/Dart pull requests and merge requests. | review | Flutter | evanca/flutter-ai-rules |
| `effective-dart` | Applies Effective Dart guidelines in Flutter/Dart code. | review | Flutter | evanca/flutter-ai-rules |
| `dart-run-static-analysis` | Execute `dart analyze` to identify warnings and errors, and use `dart fix --apply` to automatically resolve… | review | Flutter | dart-lang/skills |
| `flutter-project-audit` | Audits the health of a Flutter project as a whole — pubspec constraints and lock file, analysis_options and lints,… | review, architecture, dependency | Flutter | reis-mobile |
| `flutter-widget-review` | Reviews Flutter widget code for lifecycle bugs, BuildContext misuse across async gaps, missing dispose, side effects… | review, performance | Flutter | reis-mobile |
| `dart-3-updates` | Applies Dart 3 language features in Flutter/Dart code. | migration | Flutter | evanca/flutter-ai-rules |
| `dart-use-pattern-matching` | Applies Dart 3 pattern matching, switch expressions, and destructuring idiomatically to validate data schemas,… | — | Flutter | dart-lang/skills |

</details>

<details>
<summary><strong>Architecture and state</strong> (9)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `architecture-feature-first` | Structures Flutter apps using layered architecture (UI / Logic / Data) with feature-first file organization. | architecture | Flutter | evanca/flutter-ai-rules |
| `flutter-app-architecture` | Provides best practices for Flutter app architecture, including layered architecture, data flow, state management… | architecture | Flutter | evanca/flutter-ai-rules |
| `flutter-apply-architecture-best-practices` | Architects a Flutter application using the recommended layered approach (UI, Logic, Data). | architecture | Flutter | flutter/skills |
| `flutter-managing-state` | Manages application and ephemeral state in a Flutter app. | architecture | Flutter | flutter/skills |
| `bloc` | Implements Flutter state management using the bloc library (Bloc and Cubit). | — | Flutter | evanca/flutter-ai-rules |
| `riverpod` | Uses Riverpod for state management in Flutter/Dart. | — | Flutter | evanca/flutter-ai-rules |
| `provider` | Uses the Provider package for dependency injection and state management in Flutter. | — | Flutter | evanca/flutter-ai-rules |
| `flutter-change-notifier` | Implements state management with ChangeNotifier and Provider in Flutter. | — | Flutter | evanca/flutter-ai-rules |
| `flutter-login-usecase` | Implements a Flutter login use case that authenticates through an injected repository and persists the access token… | — | Flutter | reis-mobile |

</details>

<details>
<summary><strong>Testing</strong> (10)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `testing` | Writes and reviews Flutter/Dart tests. | test | Flutter | evanca/flutter-ai-rules |
| `dart-add-unit-test` | Write and organize unit tests for functions, methods, and classes using `package:test`. | test | Flutter | dart-lang/skills |
| `flutter-add-widget-test` | Implement a component-level test using `WidgetTester` to verify UI rendering and user interactions (tapping,… | test | Flutter | flutter/skills |
| `flutter-add-integration-test` | Configures Flutter Driver for app interaction and converts MCP actions into permanent integration tests. | test | Flutter | flutter/skills |
| `patrol-e2e-testing` | Generates and maintains end-to-end tests for Flutter apps using Patrol. | test | Flutter | evanca/flutter-ai-rules |
| `mocktail` | Uses the Mocktail package for mocking in Flutter/Dart tests. | test | Flutter | evanca/flutter-ai-rules |
| `mockito` | Uses the Mockito package for mocking in Flutter/Dart tests. | test | Flutter | evanca/flutter-ai-rules |
| `dart-generate-test-mocks` | Define and generate mock objects for external dependencies using `package:mockito` and `build_runner`. | test | Flutter | dart-lang/skills |
| `dart-collect-coverage` | Collect coverage using the coverage packge and create an LCOV report | test | Flutter | dart-lang/skills |
| `dart-migrate-to-checks-package` | Replace the usage of `expect` and similar functions from `package:matcher` to `package:checks` equivalents. | migration | Flutter | dart-lang/skills |

</details>

<details>
<summary><strong>Debug</strong> (4)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `flutter-errors` | Diagnoses and fixes common Flutter errors. | debug | Flutter | evanca/flutter-ai-rules |
| `flutter-fix-layout-issues` | Fixes Flutter layout errors (overflows, unbounded constraints) using Dart and Flutter MCP tools. | debug | Flutter | flutter/skills |
| `dart-fix-runtime-errors` | Uses get_runtime_errors and lsp to fetch an active stack trace, locate the failing line, apply a fix, and verify… | debug | Flutter | dart-lang/skills |
| `dart-resolve-package-conflicts` | Workflow for fixing package version conflicts. | debug, dependency | Flutter | dart-lang/skills |

</details>

<details>
<summary><strong>Performance</strong> (3)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `flutter-reducing-app-size` | Measures and optimizes the size of Flutter application bundles for deployment. | performance | Flutter | flutter/skills |
| `flutter-handling-concurrency` | Executes long-running tasks in background isolates to keep the UI responsive. | performance | Flutter | flutter/skills |
| `flutter-caching-data` | Implements caching strategies for Flutter apps to improve performance and offline support. | — | Flutter | flutter/skills |

</details>

<details>
<summary><strong>UI, layout and navigation</strong> (8)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `flutter-building-layouts` | Builds Flutter layouts using the constraint system and layout widgets. | — | Flutter | flutter/skills |
| `flutter-build-responsive-layout` | Use `LayoutBuilder`, `MediaQuery`, or `Expanded/Flexible` to create a layout that adapts to different screen sizes. | — | Flutter | flutter/skills |
| `flutter-building-forms` | Builds Flutter forms with validation and user input handling. | — | Flutter | flutter/skills |
| `flutter-animating-apps` | Implements animated effects, transitions, and motion in a Flutter app. | — | Flutter | flutter/skills |
| `flutter-theming-apps` | Customizes the visual appearance of a Flutter app using the theming system. | — | Flutter | flutter/skills |
| `flutter-add-widget-preview` | Adds interactive widget previews to the project using the previews.dart system. | — | Flutter | flutter/skills |
| `flutter-setup-declarative-routing` | Configure `MaterialApp.router` using a package like `go_router` for advanced URL-based navigation. | — | Flutter | flutter/skills |
| `flutter-adding-home-screen-widgets` | Adds home screen widgets to a Flutter app for Android and iOS. | — | Flutter | flutter/skills |

</details>

<details>
<summary><strong>Data and networking</strong> (3)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `flutter-use-http-package` | Use the `http` package to execute GET, POST, PUT, or DELETE requests. | — | Flutter | flutter/skills |
| `flutter-implement-json-serialization` | Create model classes with `fromJson` and `toJson` methods using `dart:convert`. | — | Flutter | flutter/skills |
| `flutter-working-with-databases` | Manages local data persistence using SQLite or other database solutions. | — | Flutter | flutter/skills |

</details>

<details>
<summary><strong>Native and plugins</strong> (3)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `flutter-building-plugins` | Builds Flutter plugins that provide native interop for other apps to use. | — | Flutter | flutter/skills |
| `flutter-interoperating-with-native-apis` | Interoperates with native platform APIs on Android, iOS, and the web. | — | Flutter | flutter/skills |
| `flutter-embedding-native-views` | Embeds native Android, iOS, or macOS views into a Flutter app. | — | Flutter | flutter/skills |

</details>

<details>
<summary><strong>Security</strong> (3)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `mobile-security-audit` | Security audit for mobile apps based on the OWASP MASVS categories — insecure token storage, hardcoded secrets,… | review, security, release | all | reis-mobile |
| `flutter-secure-token-store` | Stores JWT access tokens on Flutter with platform secure storage (Keychain on iOS, Keystore-backed storage on… | security | Flutter | reis-mobile |
| `firebase-app-check` | Integrates Firebase App Check into Flutter apps. | security | Flutter | evanca/flutter-ai-rules |

</details>

<details>
<summary><strong>Accessibility and internationalization</strong> (2)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `flutter-improving-accessibility` | Configures a Flutter app to support assistive technologies like Screen Readers. | accessibility | Flutter | flutter/skills |
| `flutter-setup-localization` | Add `flutter_localizations` and `intl` dependencies, enable "generate true" in `pubspec.yaml`, and create an… | — | Flutter | flutter/skills |

</details>

<details>
<summary><strong>Firebase</strong> (13)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `flutterfire-configure` | Sets up Firebase for Flutter apps using FlutterFire CLI. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-auth` | Integrates Firebase Authentication into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-cloud-firestore` | Integrates Cloud Firestore into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-database` | Integrates Firebase Realtime Database into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-storage` | Integrates Firebase Cloud Storage into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-cloud-functions` | Calls Firebase Cloud Functions from Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-messaging` | Integrates Firebase Cloud Messaging (FCM) into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-in-app-messaging` | Integrates Firebase In-App Messaging into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-remote-config` | Integrates Firebase Remote Config into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-analytics` | Integrates Firebase Analytics into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-crashlytics` | Integrates Firebase Crashlytics into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-ai` | Integrates Firebase AI Logic into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |
| `firebase-data-connect` | Integrates Firebase Data Connect into Flutter apps. | — | Flutter | evanca/flutter-ai-rules |

</details>

<details>
<summary><strong>Environment</strong> (2)</summary>

| Skill | What it does | Auto-routed for | Stack | Origin |
|---|---|---|---|---|
| `flutter-setting-up-on-macos` | Sets up a macOS environment for Flutter development. | — | Flutter | flutter/skills |
| `detect-mobile-stack` | Detects the mobile stack of the current project (Flutter, Android, iOS, React Native, Kotlin Multiplatform), its… | — | all | reis-mobile |

</details>

Third-party skills keep their original name and license. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## Trust, security and limits

**Read-only.** `doctor`, `detect`, `route` and `review` do not modify your project. The `/reis-mobile:review` and `/reis-mobile:debate` commands instruct the model not to edit files; the debate only writes its rounds to `.reis-mobile/debates/`, outside your code.

**Secrets masked.** The diff goes through [`core/security/redact.mjs`](core/security/redact.mjs) before reaching the model. Lock files and generated code (`*.g.dart`, `*.freezed.dart`, `*.pbxproj`) stay out of the diff. Redaction is a protection layer, not a guarantee. See [SECURITY.md](SECURITY.md).

**No telemetry.** `detect`, `doctor`, `route` and `review` make no network calls. Only installation touches the network, to download the release and register the plugin. The AI analysis uses the model of the session you are working in, such as Claude Code or Codex.

**Exception: `/reis-mobile:debate --external`.** This flag, and only this flag, sends the debate context — including excerpts of the files mentioned in the question — to the `codex` and `gemini` CLIs, which are third-party and have their own data policies. Without the flag, nothing leaves your session. The `review` diff is masked by `redact.mjs`, but the context you cite in a debate question does not go through that layer: check what you are sending before using `--external`.

**Context cost.** The descriptions of the 7 agents and 67 skills add up to about 4,800 fixed tokens per session (measured with `claude plugin details reis-mobile`). The full content of each skill is only loaded when it is used.

**No hooks.** The plugin does not attach to Claude Code events. It only acts when you call a command or when a skill is relevant.

**Own namespace.** Commands live under `/reis-mobile:*` and do not conflict with the built-in `/review` or `/security-review`.

**Verifiable installation.** The installers check the release SHA-256 and do not ask for `sudo`. `reis-mobile init --uninstall` removes the plugin without leaving configuration behind.

---

## Roadmap

| Version | Delivery | Status |
|--------|---------|--------|
| v0.1.0 | Foundation, stack detection, router, `/reis-mobile:doctor`, `/reis-mobile:review` for Flutter | ✅ |
| v0.2.0 | 6 agents and 63 Flutter, Dart and Firebase skills | ✅ |
| v0.2.1 | `/reis-mobile` entry command | ✅ |
| v0.3.0 | `/reis-mobile:debate`: multi-agent with a decision, across distinct roles and models — delivered in place of the `council` planned for v0.8.0 | ✅ |
| v0.3.1 | Answer language (`reis-mobile init pt\|en`, `reis-mobile lang`) and project content in English | ✅ |
| v0.3.4 | Back to the `reis-mobile` name after the `mobile` renames of v0.3.2 and v0.3.3 | ✅ |
| v0.4.0 | Native Android and iOS skills, `.reis-mobile/config.yaml` and `/reis-mobile:debug` (Gradle, Xcode, CocoaPods, Flutter) | ⏳ |
| v0.5.0 | `/reis-mobile:test` and native tests (XCTest, Espresso) | ⏳ |
| v0.6.0 | `/reis-mobile:release` with quality gates | ⏳ |
| v0.7.0 | React Native pack | ⏳ |
| v0.8.0 | MCP server | ⏳ |
| v0.9.0 | Multi-provider (OpenAI, Gemini, OpenRouter, Ollama) beyond the debate's `--external` | ⏳ |
| v1.0.0 | First stable version: Flutter, Android, iOS and React Native | ⏳ |

---

## FAQ

**Do I need Flutter, Xcode or the Android SDK installed?**
Not for the review, which only reads code. `/reis-mobile:doctor` shows what is missing in case you want to build.

**My app lives inside a monorepo.**
Run it from the app folder, or use `--dir apps/mobile` in the CLI. The diff is restricted to that folder.

**Does it work with native Android and iOS?**
Detection, the doctor, the security skill and the `mobile-code-reviewer`, `mobile-staff-engineer` and `lead-mobile` agents already work. Android- and iOS-specific skills arrive in v0.4.0; the 63 imported skills are for Flutter, Dart and Firebase.

**I already have skills with the same names in `~/.claude/skills`.**
The plugin's skills live in the `reis-mobile:` namespace and do not conflict, but Claude Code loads both descriptions. To save context, remove the global copies the plugin already covers.

**Does it work in Codex?**
The marketplace and plugin `0.2.1` can be installed straight from GitHub with `codex plugin`. See [installation and usage in Codex](#codex-plugin-from-github). Installation does not confirm parity with the Claude Code agents and commands; the `reis-mobile` CLI can also be run by Codex to get diagnostics and context.

**Does it work in Cursor?**
The Cursor integration has not been validated yet. The MCP server remains on the roadmap for v0.8.0.

**What does reis-mobile send outside my machine?**
The CLI sends nothing. What the model reads during `/reis-mobile:review` follows the same rules as any Claude Code session.

---

## Contributing

Contributions are welcome, especially Android, iOS and React Native skills.

1. Read [CONTRIBUTING.md](CONTRIBUTING.md), the rules in [AGENTS.md](AGENTS.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).
2. Pick a [`good first issue`](https://github.com/wrsilva/reis-mobile/labels/good%20first%20issue) or [propose a skill](https://github.com/wrsilva/reis-mobile/issues/new?template=new_skill_or_agent.yml).
3. `git clone https://github.com/<your-username>/reis-mobile.git && cd reis-mobile && npm run check`
4. Open a PR showing the output of `reis-mobile route` or `reis-mobile review` on a real project.

Questions: [Discussions](https://github.com/wrsilva/reis-mobile/discussions). Where to ask for help: [SUPPORT.md](SUPPORT.md).

---

## Documentation

- [Architecture](ARCHITECTURE.md): modules, detection, routing and the agent and skill contract
- [AGENTS.md](AGENTS.md): rules for whoever (or whichever AI) contributes to the repository
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Support](SUPPORT.md)
- [Security](SECURITY.md)
- [Third-Party Notices](THIRD_PARTY_NOTICES.md): origin and license of third-party skills
- [Changelog](CHANGELOG.md)

---

## Attribution

- **[flutter/skills](https://github.com/flutter/skills)** (BSD-3-Clause): 25 Flutter skills.
- **[dart-lang/skills](https://github.com/dart-lang/skills)** (BSD-3-Clause): 8 Dart skills.
- **[evanca/flutter-ai-rules](https://github.com/evanca/flutter-ai-rules)** (MIT): 28 Flutter, testing and Firebase skills.
- **[OWASP MASVS](https://mas.owasp.org/MASVS/)**: categories used in the `mobile-security-audit` skill.

---

## License

MIT. See [LICENSE](LICENSE).

<p align="center">
  <a href="https://github.com/wrsilva">wrsilva</a> | MIT License | <a href="https://github.com/wrsilva/reis-mobile/issues">Report Issues</a>
</p>
