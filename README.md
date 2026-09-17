# 📱 reis-mobile

A mobile app is not a generic project. A code review that does not know about `BuildContext` after `await`, `android:exported`, `NSAllowsArbitraryLoads` or `Podfile.lock` lets through exactly the bugs that only show up on the device. **reis-mobile** detects your project's stack, picks the right specialist and loads only the skills that apply to Flutter, Android, iOS or React Native.

**AI agents and skills for mobile development — Flutter, Android, iOS and React Native.** A plugin for Claude Code and Codex with specialist agents and skills for code review, debugging, tests, architecture, security and Firebase.

<p align="center">
  <a href="https://github.com/wrsilva/reis-mobile/actions/workflows/ci.yml"><img src="https://github.com/wrsilva/reis-mobile/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/Version-0.7.0-blue" alt="Version 0.7.0">
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

👥 **18 agents and 13 mobile skills.** Architect, performance and test engineers for Flutter, native Android, native iOS and React Native, a staff engineer, a native plugin specialist, a code reviewer, an accessibility auditor, a release engineer and a lead that coordinates them all, plus skills for Gradle, Xcode and CocoaPods builds, Jetpack Compose, BLoC, Riverpod, Firebase and testing on every platform, plugins, security, accessibility and releases.

🌐 **Answers in English or Portuguese.** `reis-mobile init eng` or `reis-mobile init pt` sets the language of reports, explanations and debates.

🧭 **Routes to the right specialist.** Describe the problem in English or Portuguese, and the router identifies the intent, the stack and the platform in focus. "The Android build of my Flutter app broke" loads Flutter **and** Android context.

🛡️ **Real mobile security.** Checklist based on OWASP MASVS, with concrete per-stack checks: `flutter_secure_storage`, `network_security_config`, ATS, Keychain and `AsyncStorage`.

🩺 **A doctor that understands mobile.** Checks Flutter, Dart, Java, Android SDK, Xcode, CocoaPods, Gradle wrapper and lock files, but only what matters for the detected stack.

🔒 **Secrets never reach the model.** The diff sent for review goes through a layer that masks API keys, tokens, JWTs, private keys and keystore passwords.

🪶 **Two commands to install.** `npm install -g reis-mobile` and `reis-mobile init eng` set it up in Claude Code and Codex, with zero npm dependencies, no hooks and no external provider.

---

## What's new

**v0.7.0:** `/reis-mobile:test` runs, writes, audits or fixes tests using the app's existing setup, including XCTest/XCUITest and Espresso. The 18 agents now use a shared project brief and role-specific investigations tied to actual files, symbols and constraints.

> 🆕 **v0.4.0: every mobile stack.** Native Android, native iOS and React Native get their own architect, performance and test specialists, and `/reis-mobile:debug` finds the cause of a failing build with the toolchain versions in hand.
>
> ```bash
> /reis-mobile:debug Execution failed for task ':app:compileDebugKotlin'
> /reis-mobile:debug pod install could not find compatible versions for Firebase
> ```
>
> Tests and Firebase are one skill each — `mobile-test` and `mobile-firebase` — with a guide per platform, so a request loads only what your stack needs.

| Version | Highlights |
|--------|-----------|
| **v0.7.0** (current) | `/reis-mobile:test`, native XCTest and Espresso guidance, and project-specific contracts for the 18 specialists. |
| **v0.6.0** | `mobile-accessibility-auditor` and `mobile-release-engineer` agents with the new `mobile-accessibility` and `mobile-release` skills: accessibility audits on every stack, release readiness with a go/no-go verdict, release notes and store copy, CI/CD. `mobile-debug` gains guides for ANRs, Android memory leaks and deep links. |
| **v0.5.0** | 11 skills instead of 60: topic skills with a guide per platform (`mobile-architecture`, `mobile-code-review`, `mobile-debug`, `mobile-test`, `mobile-security`, `mobile-firebase`) and platform skills (`mobile-flutter`, `mobile-android`, and the new `mobile-ios` and `mobile-rn`). Half the fixed context cost. |
| **v0.4.0** | Native Android, iOS and React Native: architect, performance and test agents for each; `/reis-mobile:debug` for Gradle, Xcode, CocoaPods and Flutter failures; `mobile-test` and `mobile-firebase` with a guide per platform; the Android team's skills; `.reis-mobile/config.yaml` for monorepos. Skills now use stack prefixes. |
| **v0.3.6** | `reis-mobile init eng` installs the plugin in Claude Code and Codex at once, skipping whichever is not installed; `init --uninstall` removes it from both. |
| **v0.3.5** | Installs through npm and the Claude Code and Codex plugins. |
| **v0.3.4** | Back to the `reis-mobile` name: `reis-mobile` CLI and `/reis-mobile:*` commands, undoing the `mobile` renames of v0.3.2 and v0.3.3. |
| **v0.3.1** | Answers in English or Portuguese: `reis-mobile init pt\|en` and `reis-mobile lang` save the language for reports, doctor explanations and debates. Agents, skills, commands and docs are now written in English. |
| **v0.3.0** | `/reis-mobile:debate` command: three specialists with conflicting priorities debate over two rounds and `lead-mobile` decides. Participants vary in role and model; `--external` adds Codex and Gemini. Brings forward the `council` planned for v0.8.0. |
| **v0.2.1** | `/reis-mobile` command: lists the commands and forwards to `doctor`, `review` or, with a free-form request, to the agent and skills for the detected stack. Shows up in the VS Code extension command menu. |
| **v0.2.0** | 6 new agents (`flutter-architect`, `flutter-performance-engineer`, `flutter-test-engineer`, `mobile-staff-engineer`, `plugin-native-expert`, `lead-mobile`) and 63 new Flutter, Dart and Firebase skills. The router now has a specialist for debug, test, architecture and performance. |
| **v0.1.0** | `reis-mobile` plugin for Claude Code. Detection of 5 stacks. Intent + stack → agent + skills router. Context engine with masked diff. `/reis-mobile:doctor` and `/reis-mobile:review`. `reis-mobile` CLI. |

[Full changelog →](CHANGELOG.md)

## Installation

You need **Node.js 22+** and **[Claude Code](https://claude.com/claude-code)**, the **Codex CLI**, or both.

### Install

```bash
npm install -g reis-mobile
reis-mobile init eng
```

`init` installs the plugin in Claude Code and Codex, whichever you have, and sets the answer language (`eng` or `pt`):

```text
✓ Claude Code installed
✓ Codex       installed
✓ Language    en (~/.config/reis-mobile/config.json)
```

Restart Claude Code and Codex, open your app folder and try it:

| Tool | Try |
|---|---|
| Claude Code | `/reis-mobile:doctor`, then `/reis-mobile:review` |
| Codex | Type `$` to search the skills, or use `/skills` |

### Update

```bash
npm update -g reis-mobile
reis-mobile init eng
```

Then restart Claude Code and Codex. See what changed in the [CHANGELOG](CHANGELOG.md).

### Uninstall

```bash
reis-mobile init --uninstall
npm uninstall -g reis-mobile
```

The first command removes the plugin from Claude Code and Codex and deletes the saved language; the second removes the CLI. Keep the `-g`: without it, npm looks for the package in the current folder and removes nothing.

<details>
<summary>Install without npm</summary>

Add the plugin straight from GitHub. The `marketplace add` line only needs to run once per machine.

```bash
# Claude Code
claude plugin marketplace add https://github.com/wrsilva/reis-mobile.git
claude plugin install reis-mobile@reis-mobile

# Codex
codex plugin marketplace add https://github.com/wrsilva/reis-mobile.git
codex plugin add reis-mobile@reis-mobile
```

To update, run `claude plugin marketplace update reis-mobile` and `claude plugin update reis-mobile@reis-mobile` in Claude Code, or `codex plugin marketplace upgrade reis-mobile` and `codex plugin add reis-mobile@reis-mobile` in Codex.

To uninstall:

```bash
# Claude Code
claude plugin uninstall reis-mobile@reis-mobile
claude plugin marketplace remove reis-mobile

# Codex
codex plugin remove reis-mobile@reis-mobile
codex plugin marketplace remove reis-mobile
```
</details>

<details>
<summary>Language</summary>

Agents, skills and commands are written in English. The language you choose is the one reis-mobile **answers** in: `/reis-mobile:review` reports, `/reis-mobile:doctor` explanations, and debate rounds and syntheses.

```bash
reis-mobile lang pt          # switch to Brazilian Portuguese without reinstalling
reis-mobile lang eng         # switch to English
reis-mobile lang             # show the current language
```

The choice is saved to `~/.config/reis-mobile/config.json` (`%APPDATA%\reis-mobile\config.json` on Windows) and survives plugin updates. `--lang` on a single run and the `REIS_MOBILE_LANG` environment variable override it. With nothing set, each command answers in the language of your request. Agents that Claude Code triggers on its own, outside a `/reis-mobile:*` command, follow the language of the conversation.
</details>

<details>
<summary>Using the CLI from Codex</summary>

The Codex plugin gives Codex the skills; the agents and the `/reis-mobile:*` commands are Claude Code formats and have not been validated in Codex. For routing and review context, run the CLI in the app folder:

```bash
reis-mobile doctor
reis-mobile route "review architecture" --json
reis-mobile review --json
```

You can also ask Codex: *"Run `reis-mobile review --json`, read the instructions in the returned files and review the changes using that context."* The CLI selects the instructions and gathers the context; Codex does the analysis.
</details>

<details>
<summary>Troubleshooting</summary>

| Symptom | Solution |
|---------|---------|
| Codex says `plugin reis-mobile was not found in marketplace reis-mobile` | The marketplace is not registered or is outdated. Run `reis-mobile init eng`, or `codex plugin marketplace add https://github.com/wrsilva/reis-mobile.git` followed by `codex plugin add reis-mobile@reis-mobile` |
| `claude plugin update` says it is already on the latest version, but the release is newer | Run `claude plugin marketplace update reis-mobile` before `update` |
| New agents or skills do not show up | Restart Claude Code or Codex: plugins only reload in a new session |
| `reis-mobile --version` still shows the old version after updating | Another `reis-mobile` comes first on the `PATH`; find it with `which -a reis-mobile` (`where.exe reis-mobile` on Windows) and remove it |
| `npm uninstall reis-mobile` says `up to date` and the command is still there | Add `-g`: `npm uninstall -g reis-mobile` |
| `/reis-mobile:*` commands missing after upgrading from v0.3.2 or v0.3.3 | Those versions named the plugin `mobile`. Run `reis-mobile init eng`: it installs `reis-mobile@reis-mobile` and removes `mobile@reis-mobile` |
| Plugin broken after updating | Reinstall: `reis-mobile init --uninstall`, then `reis-mobile init eng` |

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

After editing agents, skills or commands, restart Claude Code or Codex.
</details>

---

## Commands

```bash
/reis-mobile                                      # Lists the commands (also accepts doctor, review, debug, test, debate or a free-form request)
/reis-mobile my android build fails on gradle     # Free-form request: detects the stack and applies the right agent and skills
/reis-mobile:doctor                               # Environment and project: SDKs, Xcode, CocoaPods, Gradle wrapper, lock files
/reis-mobile:doctor --all                         # Checks every tool, not only those for the detected stack
/reis-mobile:review                               # Reviews uncommitted changes (or the whole project, if there are none)
/reis-mobile:review --base main                   # Reviews the current branch against main, pull request style
/reis-mobile:review --base main focus on security # Free-form focus, in English or Portuguese
/reis-mobile:debug pod install fails on CI        # Finds the cause of a build or runtime failure and proposes the fix
/reis-mobile:test run the checkout unit tests    # Uses the existing runner, module or scheme
/reis-mobile:test add XCTest coverage for cancellation # Tests the actual Swift type and its dependency seams
/reis-mobile:test audit Espresso checkout tests  # Reviews assertions and synchronization without editing
/reis-mobile:debate Riverpod or BLoC in this app? # Debate between the specialists, with a decision by lead-mobile
/reis-mobile:debate --rounds 3 --external ...     # More rounds; --external adds Codex and Gemini, if installed
```

### Debug

`/reis-mobile:debug` takes the error, the failing command or a description of the problem. It routes to the debug agent and to the skills for the stack and the build area it recognizes (`gradle`, `xcode`, `cocoapods`, `signing`, `pub`...), adds the doctor report with the installed toolchain versions, and answers with the cause, the evidence, the minimal fix and how to verify it.

It proposes; it does not change your project on its own. Commands that alter files or caches — `flutter clean`, `pod install`, deleting `DerivedData` or Gradle caches, dependency upgrades — only run after you ask it to apply the fix.

### Test

`/reis-mobile:test` uses the request to choose whether to run existing tests, write missing tests, audit coverage or fix failures. With no request, it selects tests for the current changes or the documented default local suite in a clean project; if neither can be established, it inventories the setup and reports the limitation. It identifies the actual classes, functions, modules and test targets before proposing cases. Flutter widget/integration tests, Android JVM tests and Espresso/Compose instrumentation, iOS XCTest/Swift Testing and XCUITest, and React Native unit/component/E2E setups use their own references.

The command discovers Gradle modules and variants or Xcode workspaces, schemes, test plans and destinations from the project. It reports exact commands, results and checks blocked by missing SDKs or devices; static inspection is never reported as a passing native test. A request to run tests executes the available relevant tests, while an audit stays read-only.

The companion CLI prepares context for the model; it does not execute the app's tests:

```bash
reis-mobile test --dir apps/mobile --json -- "audit checkout tests"
reis-mobile test --base main -- "write regression tests for these changes"
```

Its output includes the resolved project directory, explicit `test` intent, selected specialist and skills, redacted change context, toolchain diagnostics and answer language. `/reis-mobile test ...` forwards to the same slash-command workflow.

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
Skills      mobile-debug

$ reis-mobile route "write tests for the login cubit"
Intent      test (confidence 1)
Stack       flutter
Agent       flutter-test-engineer
Skills      mobile-test
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
| Review the architecture of an app | agent `flutter-architect`, `android-architect`, `ios-architect` or `rn-architect` | ✅ |
| Find the cause of jank, rebuilds, hangs or leaks | agent `flutter-`, `android-`, `ios-` or `rn-performance-engineer` | ✅ |
| Write or audit tests | agent `flutter-`, `android-`, `ios-` or `rn-test-engineer` | ✅ |
| Debug a Gradle, Xcode, CocoaPods or Flutter build | `/reis-mobile:debug` | ✅ |
| Build a plugin or debug MethodChannel/EventChannel | agent `plugin-native-expert` | ✅ |
| Audit a screen for TalkBack, VoiceOver, touch targets and text scaling | agent `mobile-accessibility-auditor` | ✅ |
| Check release readiness, write release notes or set up CI/CD | agent `mobile-release-engineer` | ✅ |
| Full audit with several specialists | agent `lead-mobile` | ✅ |
| Decide between two architectures with a real trade-off | `/reis-mobile:debate` | ✅ |
| Dedicated test command (including XCTest and Espresso) | `/reis-mobile:test` | ✅ |
| Check whether the app is ready for the store | `/reis-mobile:release` | 🔜 v0.8 |
| Consolidated decision by consensus between agents | `/reis-mobile:council` | 🔜 v0.10 |

<details>
<summary><strong>How is it different from plain Claude Code?</strong></summary>

| | Plain Claude Code | reis-mobile |
|---|---|---|
| **Domain** | Generic | Flutter, Android, iOS, React Native, KMP |
| **Project context** | You explain the stack | Deterministic detection of stack, platform and variant |
| **Review** | Generic | Mobile checklists: lifecycle, `BuildContext`, MASVS, manifest, ATS |
| **Secrets in the diff** | Sent as they are | Masked before reaching the model |
| **Specialists** | None | 18 agents and 13 mobile skills |
| **Context cost** | Zero | ~4,300 fixed tokens (agent and skill descriptions), no hooks |
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
     ├─ select skills ─────── mobile-code-review · mobile-flutter · mobile-security
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

Agents share a [project brief contract](docs/agent-context.md): app root, requested outcome, real objects at `path:line`, established conventions, constraints and validation commands. They reuse a caller's brief and load technical checklists from the relevant skill. Architects deliver boundary decisions, performance engineers deliver measurement plans and evidence, test engineers deliver behavior-to-test coverage, and the lead resolves conflicting findings.

For domain knowledge that code cannot reveal, optionally commit `.reis-mobile/project.md` with critical user journeys, invariants, deliberate boundaries and CI commands. The model reads it alongside repository instructions and verifies it against code. It is Markdown context, not a new key in `.reis-mobile/config.yaml`; no setup file is required. See the [team context example](docs/agent-context.md#optional-team-context).

| Agent | Stack | Triggered for | What it does |
|-------|-------|---------------|-----------|
| `mobile-code-reviewer` | all | review | Review with `file:line` evidence, focused on what breaks in production |
| `flutter-architect` | Flutter | architecture | Layers, feature-first, coupling, misplaced logic, refactoring plan |
| `flutter-performance-engineer` | Flutter | performance | Rebuilds, jank, lists, leaks, paint, startup, with a score and top 3 fixes |
| `flutter-test-engineer` | Flutter | test | Unit, BLoC/Cubit, widget and integration, coverage audit and fragile tests |
| `android-architect` | Android | architecture | UI, domain and data layers, Gradle modules, ViewModel and DI boundaries |
| `android-performance-engineer` | Android | performance | Compose recomposition, lists, ANRs, startup, leaks, app size |
| `android-test-engineer` | Android | test | ViewModel and coroutine tests, Compose and Espresso UI tests, flaky tests |
| `ios-architect` | iOS | architecture | SwiftUI and UIKit structure, packages, navigation, concurrency boundaries |
| `ios-performance-engineer` | iOS | performance | Hangs, SwiftUI updates, lists, launch time, retain cycles, memory |
| `ios-test-engineer` | iOS | test | Swift Testing and XCTest unit tests, async code, XCUITest flows |
| `rn-architect` | React Native | architecture | Feature structure, server vs client state, navigation, native modules |
| `rn-performance-engineer` | React Native | performance | Re-renders, lists, JavaScript thread, animations, startup, bundle size |
| `rn-test-engineer` | React Native | test | Jest, React Native Testing Library, native module mocks, Detox or Maestro |
| `mobile-accessibility-auditor` | all | accessibility | Screen reader labels, roles and states, touch targets, text scaling, focus and announcements, with fixes per platform |
| `mobile-release-engineer` | all | release, deployment | Go/no-go readiness, versions and signing, crash symbols, release notes and store copy, CI/CD, staged rollout |
| `mobile-staff-engineer` | all | debug, architecture, performance, test, security, migration, dependency, build | Senior Flutter/Android/iOS specialist for whatever no specific agent covers |
| `plugin-native-expert` | Flutter | on demand | MethodChannel, EventChannel, Pigeon and Kotlin/Swift bridges, threading and lifecycle |
| `lead-mobile` | all | on demand | Coordinates the other agents and consolidates a single action plan |

When more than one agent serves the intent, the stack-specific one wins. In a Flutter app, `performance` goes to `flutter-performance-engineer`; in a native Android app, to `android-performance-engineer`. `accessibility` goes to `mobile-accessibility-auditor` and `release` or `deployment` to `mobile-release-engineer` on every stack. Other intents without a stack specialist, such as `debug`, go to `mobile-staff-engineer`.

### Skills

Every skill starts with `mobile-`. **Topic** skills cover every stack with one reference per platform; **platform** skills hold what exists only on one stack. A request loads the skill, and the model then opens only the reference for your stack and task.

| Skill | Covers | Auto-routed for | References |
|---|---|---|---|
| `mobile-architecture` | Layers, state management, modularization, DI, navigation | architecture | Flutter (BLoC, Riverpod, Provider, ChangeNotifier...), Android, iOS, React Native |
| `mobile-code-review` | Review process and checklists | review, performance | Flutter (PR review, widgets, project audit, static analysis), Android, iOS, React Native |
| `mobile-debug` | Failing builds and runtime errors | debug, build, dependency, migration | Flutter (build, runtime, layout, packages), Android (Gradle, crashes, ANRs, memory leaks), iOS (Xcode, CocoaPods, crash logs), React Native (Metro, native modules), deep links |
| `mobile-test` | Unit, UI, integration and end-to-end tests | test | Flutter (widget, integration, Patrol, mocks, coverage), Android, iOS, React Native |
| `mobile-security` | OWASP MASVS security checks | review, security, release | Flutter (token storage), Android (intents), iOS, React Native |
| `mobile-accessibility` | Screen readers, touch targets, text scaling, contrast | accessibility | Flutter (Semantics), Android (Compose and Views), iOS (SwiftUI and UIKit), React Native |
| `mobile-release` | Release readiness, store copy and CI/CD | release, deployment | Flutter, Android, iOS, React Native, release notes and store listing, CI/CD |
| `mobile-firebase` | Firebase setup and 13 products | — | Flutter, Android, iOS, React Native, each with a guide per product |
| `mobile-flutter` | Flutter and Dart specifics | review, performance, accessibility, migration | UI and navigation, data, native code, performance, accessibility and i18n, Dart, setup |
| `mobile-android` | Native Android specifics, from the Android team | performance, release, migration, build, dependency | Compose UI, AGP 9 and R8, profiling, Google Play, identity, camera and media, on-device AI, Wear OS, TV, XR |
| `mobile-ios` | Native iOS specifics | performance, release, accessibility | UI and navigation, data and networking, platform features, performance and release |
| `mobile-rn` | React Native and Expo specifics | performance, release, accessibility | UI and navigation, data and networking, platform features, performance and release |
| `mobile-detect-stack` | Deterministic stack detection with the CLI | — | — |

Skills marked — are triggered by Claude Code when the request matches their description, for example *"add push notifications with FCM"* → `mobile-firebase`.

About 85 guides come from [flutter/skills](https://github.com/flutter/skills), [dart-lang/skills](https://github.com/dart-lang/skills), [evanca/flutter-ai-rules](https://github.com/evanca/flutter-ai-rules) and [android/skills](https://github.com/android/skills), unchanged and credited in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## Trust, security and limits

**Read-only CLI context.** `doctor`, `detect`, `route`, `review` and `test` do not modify your project. The `/reis-mobile:test` slash command can write or fix tests and execute runners when requested. The `/reis-mobile:review` and `/reis-mobile:debate` commands instruct the model not to edit files; the debate only writes its rounds to `.reis-mobile/debates/`, outside your code.

**Secrets masked.** The diff goes through [`core/security/redact.mjs`](core/security/redact.mjs) before reaching the model. Lock files and generated code (`*.g.dart`, `*.freezed.dart`, `*.pbxproj`) stay out of the diff. Redaction is a protection layer, not a guarantee. See [SECURITY.md](SECURITY.md).

**No telemetry.** `detect`, `doctor`, `route`, `review`, `debug` and `test` make no network calls. Only installation touches the network, to download the package and register the plugin. The Google Play policy guide in `mobile-android` runs Python scripts that download your app's public Google Play listing when the model uses it. The AI analysis uses the model of the session you are working in, such as Claude Code or Codex.

**Exception: `/reis-mobile:debate --external`.** This flag, and only this flag, sends the debate context — including excerpts of the files mentioned in the question — to the `codex` and `gemini` CLIs, which are third-party and have their own data policies. Without the flag, nothing leaves your session. The `review` diff is masked by `redact.mjs`, but the context you cite in a debate question does not go through that layer: check what you are sending before using `--external`.

**Context cost.** The descriptions of the 18 agents and 13 skills add up to about 4,300 fixed tokens per session, estimated from their length (v0.3 measured about 4,800 with `claude plugin details reis-mobile`). The full content of each skill is only loaded when it is used.

**No hooks.** The plugin does not attach to Claude Code events. It only acts when you call a command or when a skill is relevant.

**Own namespace.** Commands live under `/reis-mobile:*` and do not conflict with the built-in `/review` or `/security-review`.

**Clean uninstall.** `reis-mobile init --uninstall` removes the plugin and its marketplace from Claude Code and Codex, and the saved language, without leaving configuration behind.

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
| v0.3.5 | Distribution through npm and the Claude Code and Codex plugins only | ✅ |
| v0.3.6 | `reis-mobile init` installs in Claude Code and Codex | ✅ |
| v0.4.0 | Native Android and iOS skills, architect, performance and test agents for Android, iOS and React Native, `.reis-mobile/config.yaml` and `/reis-mobile:debug` (Gradle, Xcode, CocoaPods, Flutter) | ✅ |
| v0.5.0 | Topic and platform skills (`mobile-*`), with guides for Flutter, Android, iOS and React Native in each; new `mobile-ios` and `mobile-rn` | ✅ |
| v0.6.0 | Accessibility auditor and release engineer agents, `mobile-accessibility` and `mobile-release` skills, ANR, memory leak and deep link debugging guides | ✅ |
| v0.7.0 | `/reis-mobile:test`, native tests (XCTest, Espresso) and project-specific specialist contracts | ✅ |
| v0.8.0 | `/reis-mobile:release` with quality gates | ⏳ |
| v0.9.0 | MCP server | ⏳ |
| v0.10.0 | Multi-provider (OpenAI, Gemini, OpenRouter, Ollama) beyond the debate's `--external` | ⏳ |
| v1.0.0 | First stable version: Flutter, Android, iOS and React Native | ⏳ |

---

## FAQ

**Do I need Flutter, Xcode or the Android SDK installed?**
Not for the review, which only reads code. `/reis-mobile:doctor` shows what is missing in case you want to build.

**My app lives inside a monorepo.**
Commit a `.reis-mobile/config.yaml` at the repository root pointing at the app:

```yaml
app: apps/mobile
```

Every command then analyzes `apps/mobile`, wherever in the repository you run it, and the review diff is restricted to that folder. Without the file, run from the app folder or pass `--dir apps/mobile`.

**Does it work with native Android and iOS?**
Yes. Native Android, native iOS and React Native each have architect, performance and test agents, and the cross-platform skills — `mobile-debug`, `mobile-code-review`, `mobile-test` and `mobile-firebase` — have a guide for each of them (Gradle and R8, Xcode and CocoaPods, Metro and native modules). The platform skills `mobile-android`, `mobile-ios` and `mobile-rn` add what exists only on each stack; `mobile-android` includes the Android team's guides from `android/skills` (Compose, AGP 9, R8, Play policy, Wear, TV and more).

**I already have skills with the same names in `~/.claude/skills`.**
The plugin's skills live in the `reis-mobile:` namespace and do not conflict, but Claude Code loads both descriptions. To save context, remove the global copies the plugin already covers.

**Does it work in Codex?**
Yes: `reis-mobile init eng` installs the plugin in Codex too. See [installation](#install). Installation does not confirm parity with the Claude Code agents and commands; the `reis-mobile` CLI can also be run by Codex to get diagnostics and context.

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
- **[OWASP MASVS](https://mas.owasp.org/MASVS/)**: categories used in the `mobile-security` skill.

---

## License

MIT. See [LICENSE](LICENSE).

<p align="center">
  <a href="https://github.com/wrsilva">wrsilva</a> | MIT License | <a href="https://github.com/wrsilva/reis-mobile/issues">Report Issues</a>
</p>
