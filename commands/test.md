---
description: Write, run, audit or fix mobile tests using the project's actual targets and test setup, including XCTest, XCUITest and Espresso
argument-hint: "[--base <ref>] [run, write, audit or fix + target, behavior or failing test]"
allowed-tools: ["Bash(node:*)", "Bash(git:*)", "Bash(flutter:*)", "Bash(dart:*)", "Bash(./gradlew:*)", "Bash(gradlew.bat:*)", "Bash(xcodebuild:*)", "Bash(xcrun:*)", "Bash(swift:*)", "Bash(adb:*)", "Bash(npm:*)", "Bash(pnpm:*)", "Bash(yarn:*)", "Bash(npx:*)", "Read", "Grep", "Glob", "Edit", "Write"]
---

# reis-mobile test

Arguments received: `$ARGUMENTS`

## 1. Route the request

Extract `--base <ref>` if present; the remaining arguments are the user's test request in free text. Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" test --dir "$PWD" [--base <ref>] -- "<test request>"
```

The bracketed option and quoted request are placeholders: omit an absent option and pass the request as a single literal argument after `--`. Use proper shell escaping for all supplied values; double quotes alone do not protect `$()`, backticks or embedded quotes. Never evaluate the request as shell code.

The CLI forces the `test` intent, even when the request describes a crash or build failure. It reports `Project`, `Stack`, native platform `focus`, `Agent`, `Skills`, `Language`, git `Context`, warnings and doctor checks. It prepares context; it does not run a test suite. If it fails, show the error and stop. Exit status zero means context was prepared, not that tests passed.

Use the resolved `Project` directory (`detection.projectDir` in JSON) for all project reads and test commands. Git context paths are relative to `context.repoRoot`; use that root when opening listed files. In a monorepo, do not run tests from the initial `$PWD` merely because the command started there.

## 2. Load the role and bind it to the project

Read, in order:

1. `${CLAUDE_PLUGIN_ROOT}/docs/agent-context.md` and build its Project brief from the resolved project, the user's request and the git context.
2. `${CLAUDE_PLUGIN_ROOT}/agents/<Agent>.md` for the selected role.
3. `${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md` for each routed skill. Follow `mobile-test` to the applicable platform references; XCTest/XCUITest needs the iOS reference and Espresso needs the Android reference, including when they live inside Flutter or React Native.

Identify the actual production symbols, observable behaviors, existing test files, fixtures, dependency injection seams, test framework versions and runner configuration. Cite their paths in the brief. When working from a diff, also read untracked files and any truncated files needed to understand the affected behavior. Pass this brief with the request to the selected agent, or apply that role directly if delegation is unavailable. Do not treat illustrative classes or commands in references as project facts.

## 3. Choose the requested work

Interpret the user's words and conversation; `run`, `write`, `audit` and `fix` describe work, not required CLI subcommands.

| Request | Work |
|---|---|
| Run existing tests | Select the suite matching the named target or changed behavior; execute and report it. Do not rewrite failing assertions. |
| Write tests | Add focused tests for the specified production behavior using existing helpers and conventions, then run them. |
| Audit tests or coverage | Read the relevant production code and tests; report missing behaviors, weak assertions and sources of flakiness with evidence. Keep the audit read-only. |
| Fix failing or flaky tests | Reproduce the named failure, identify whether the defect is in production code, fixtures or synchronization, apply the smallest supported fix and rerun. |

Without a request, use changed production symbols to select the relevant existing tests. If the project is clean, run its documented default local suite when one exists. If there is no grounded target or runnable default, inventory the test setup and report that limitation; do not invent a business flow or add boilerplate tests.

## 4. Discover and run the exact target

Read scripts, CI jobs, build files and existing test configuration before choosing commands. Keep the smallest suite that proves the requested behavior. Test commands may write normal build outputs; honor authorization already given in the conversation. Never install packages, create devices, change signing or alter shared environments merely to make a command run.

| Stack | Evidence and execution |
|---|---|
| Flutter / Dart | Read `pubspec.yaml`, the lock file, test helpers and the matching `test/` or `integration_test/` files. Select unit, widget or integration tests from that evidence; use the installed framework and project runner. |
| Android / Espresso | Read `settings.gradle(.kts)`, the owning module's build file, version catalog, runner and the actual `src/test` or `src/androidTest` files. Discover tasks with the repository's Gradle wrapper. Run the verified local test task for unit tests; Espresso uses the configured instrumented task and an available device. Do not assume the module is `:app`, the variant is `debug` or a task exists. Match the failing view interaction and idling behavior to the app's real view IDs and async work. |
| iOS / XCTest / XCUITest | Read the actual `.xcworkspace`/`.xcodeproj` or `Package.swift`, shared schemes, test plans and test targets. Use `xcodebuild -list` with the discovered project/workspace, and `-showdestinations` with the discovered scheme, before constructing a test command. XCTest unit tests and XCUITest UI tests must use the owning target, existing test identifiers and an available destination. Use `swift test` only for a Swift package whose tests run on the host. Never copy a sample scheme, simulator name or target. |
| React Native / Expo | Read the package manager lock file, `package.json` scripts, test config and helpers. Use the existing Jest/React Native Testing Library runner, or the configured Detox/Maestro flow for E2E. Native module tests additionally follow the Android or iOS row. |

Use an already available compatible device or simulator when authorized. If one must be started, respect the user's existing authorization and environment constraints. When the required SDK, runner, device, credentials or dependencies are unavailable, run any independent local tests that can still provide useful evidence and report the exact blocked command and prerequisite. Do not label an unexecuted test as passed. Never weaken assertions, add sleeps/retries or skip a failing case just to produce a green result.

## 5. Report evidence

Follow the selected agent's report format and include:

- Resolved project, stack, selected role, applied skills and routing warnings.
- Target production symbols and behaviors covered, with test file paths.
- Files changed and why, or audit findings ordered by risk.
- Exact commands actually executed, working directories and their outcomes; report test counts only when the runner produced them.
- Commands not executed, their blockers and the precise next verification step. Keep context preparation separate from test results.

Write all user-facing prose in the CLI's `Language`: `en` is English, `pt` is Brazilian Portuguese. With `-` or `null`, follow the user's request. Preserve code, identifiers, paths, commands and quoted tool output as written.
