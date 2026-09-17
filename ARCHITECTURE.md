# Architecture

reis-mobile is a Claude Code plugin with a deterministic Node.js core. The core decides **what** to load (stack, intent, agent, skills, context); the model decides **how** to review, debug or implement, following the loaded instructions.

```text
USER ──► COMMAND (/reis-mobile:review)
              │
              ▼
          ROUTER ◄──── Intent detector (prompt)
              │  ◄──── Stack detector (project files)
              │  ◄──── Registry (agents, skills, stacks)
              ▼
     AGENT + SKILLS ◄── Context engine (git diff, secret redaction)
              │
              ▼
     Claude Code (Read/Grep/Bash) ──► report
```

## Decisions

| Decision | Reason |
|---|---|
| **Zero npm dependencies** | The plugin runs straight from the Claude Code cache, where nobody runs `npm install`. That is why there is a custom frontmatter parser and tests with `node:test`. |
| **Routing metadata in the frontmatter** | `intents` and `stacks` live in the same file Claude Code reads. The router and the plugin cannot disagree about what exists. |
| **Deterministic detection, not LLM-based** | Stack detection must be predictable, testable and cheap. The model receives the finished result. |
| **The project on disk decides the stack** | The prompt only fills in an unknown stack or focuses on a native platform of a cross-platform app. "The Android build" in a Flutter app is still Flutter, with focus on Android. |
| **No agent, no guess** | When no intent has a registered agent, the router emits a warning instead of picking the "closest" one. |
| **Flat skill entry points** | `skills/mobile-<name>/SKILL.md`: topic skills share a workflow and link platform references; platform skills link focused guides. It is the layout Claude Code discovers automatically. |
| **Project-specific agent contracts** | All agents reuse `docs/agent-context.md` for evidence gathering; each role defines its investigation and deliverable. Technical checklists live in skills. |
| **Secrets masked before the model** | The diff goes through `redactSecrets` before leaving the CLI. The patterns target literals (`apiKey = "AIza..."`), not identifiers (`final token = await read()`), so the review is not harmed. |

## Modules

```text
core/
├── paths.mjs                    plugin root
├── config/
│   ├── language.mjs             answer language: en | pt, saved outside the plugin cache
│   └── project.mjs              .reis-mobile/config.yaml: the app folder of a monorepo
├── detection/
│   ├── project-probe.mjs        bounded project reading (skips build/, Pods/, node_modules/...)
│   └── stack-detector.mjs       per-stack rules, in priority order
├── registry/
│   ├── frontmatter.mjs          YAML subset used in the frontmatters
│   └── registry.mjs             loads and validates stacks, agents and skills
├── router/
│   ├── intents.mjs              vocabulary: intents, stack hints, areas
│   ├── intent-detector.mjs      prompt → intent, stack, area
│   └── router.mjs               intent + stack → agent + skills
├── context/
│   └── context-engine.mjs       changed files and diff (working tree, range or project)
├── diagnostics/
│   └── doctor.mjs               tools and project configuration
├── install/
│   ├── init.mjs                 reis-mobile init: installs in every tool found on the PATH
│   ├── claude-plugin.mjs        Claude Code steps
│   └── codex-plugin.mjs         Codex steps
└── security/
    └── redact.mjs               secret masking
```

## Stack detection

Rules run in priority order. Cross-platform stacks come first because they contain native folders:

| Order | Stack | Required evidence |
|---|---|---|
| 1 | `flutter` | `pubspec.yaml` with `sdk: flutter` (a pure Dart package does not count) |
| 2 | `react-native` | `package.json` depending on `react-native` (`expo` variant if it depends on `expo`) |
| 3 | `kotlin-multiplatform` | `build.gradle.kts` at the root or one level below applying the multiplatform plugin |
| 4 | `android` | Gradle at the root **and** (`AndroidManifest.xml` or a `com.android.*` plugin) |
| 5 | `ios` | `*.xcodeproj`/`*.xcworkspace`, `Podfile` or `Package.swift` with `.iOS(...)` |

Every matching stack appears in `candidates`. The first one is the main stack.

## Routing

1. **Intent.** The command's explicit intent wins. Without one, the prompt terms are normalized (lowercase, no accents) and counted, in English and Portuguese. Longer terms claim their span first, so "testflight" does not count as "test". Build, deploy, dependency or migration failures become `debug`.
2. **Stack.** The stack detected on disk wins. Platforms mentioned in the prompt, or implied by the area (`gradle` → android, `xcode` → ios), become `platformFocus` when the project has them.
3. **Agent.** Must declare the intent. A stack-specific agent beats a `"*"` agent.
4. **Skills.** Must declare the intent. The order is: main stack, then focused platforms, then `"*"`. Among skills of the same stack, one that declares the detected area (`areas: [cocoapods]`) comes first. Cross-platform skills such as `mobile-debug` do not declare areas: they receive the detected `area` in the command output and pick the matching reference themselves.

Components with `routing: manual` are never selected by the router. Claude Code invokes them only by their description.

## Component contract

Agent (`agents/<name>.md`):

```yaml
---
name: mobile-code-reviewer        # same as the file name
description: Use this agent to... # used by Claude Code to decide when to delegate
model: inherit
tools: ["Read", "Grep", "Glob", "Bash"]
intents: [review]                 # reis-mobile: intents served
stacks: ["*"]                     # reis-mobile: stacks served ("*" = all)
---
```

Skill (`skills/<name>/SKILL.md`):

```yaml
---
name: mobile-code-review          # same as the folder name; every skill starts with mobile-
description: Reviews mobile code for...
intents: [review, performance]
stacks: ["*"]                     # topic skill; platform skills declare their one stack
# areas: [gradle]                 # optional: build areas it is specific to (ranks it first)
# routing: manual                 # optional: out of automatic routing
# source: https://github.com/...  # third-party skills: origin
# license: MIT                    # required when source is present
---
```

`reis-mobile validate` (and CI) rejects a name that differs from the file, a missing description, unknown intents or stacks, `source` without `license`, and duplicates. A test ensures every skill with `source` appears in `THIRD_PARTY_NOTICES.md`.

## Project configuration

`.reis-mobile/config.yaml` holds settings a team commits with the repository. It is looked up from the command's folder upwards, so any folder inside a monorepo finds it. The only key today is `app`, the mobile app folder relative to the file's repository root: `detect`, `doctor`, `route`, `review`, `debug` and `test` analyze that folder unless the command already runs inside it. Unknown keys produce a warning, not an error, so older versions of the CLI keep working with newer files.

The optional `.reis-mobile/project.md` carries domain knowledge for the model, not CLI configuration. Agents read it alongside applicable repository instructions and verify it against current code using the [shared project brief contract](docs/agent-context.md). The core does not parse it or infer product requirements.

## Test workflow

`reis-mobile test` forces the `test` intent, resolves the app directory, and combines routing with the existing redacted change context and doctor report. It does not invoke a test runner. `/reis-mobile:test` consumes that context, grounds the work in real symbols and test targets, and follows the user's requested run, write, audit or fix scope through the selected specialist and `mobile-test` references. Native targets in cross-platform apps require the corresponding native reference even when the main agent remains Flutter or React Native.

## Language

Instructions are written once, in English. The answer language is a user setting, not a second copy of the content: `reis-mobile init <eng|pt>` or `reis-mobile lang <eng|pt>` saves it to `~/.config/reis-mobile/config.json`, outside the Claude Code plugin cache, which `claude plugin update` replaces. `detect`, `doctor`, `route` and `review` print it as `Language` (`language` in JSON), and every command tells the model to write in it. Precedence: `--lang`, then `REIS_MOBILE_LANG`, then the file; with nothing set the output is `-` and the model follows the language of the request.

## Distribution

The CLI and the plugins are the same code, published through three channels:

| Channel | Source | Installs |
|---|---|---|
| Claude Code plugin | This repository, as a GitHub marketplace (`reis-mobile@reis-mobile`) | Agents, skills, commands, and the CLI under `${CLAUDE_PLUGIN_ROOT}/bin` |
| Codex plugin | The same marketplace, through `codex plugin` | Skills |
| npm (`reis-mobile`) | `npm publish` in the release workflow, when the `NPM_TOKEN` secret exists | The `reis-mobile` command; `reis-mobile init` installs the plugin in Claude Code and Codex, whichever are on the `PATH` |

`package.json` `files` decides what the npm package contains, including `THIRD_PARTY_NOTICES.md`, which the MIT and BSD-3-Clause licenses of the imported skills require. CI packs the package and installs it globally on Linux, macOS and Windows before running the CLI.

There is no native binary: reis-mobile depends on Node.js 22+, declared in `engines`.

## Out of scope for this version

These items remain in the plan but are not implemented yet: `.codex-plugin/` (the manifest format has not been verified yet), a general provider abstraction, MCP server, hooks, core-managed multi-agent execution and execution logs. The debate command already coordinates agents through model instructions.
