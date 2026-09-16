# AGENTS.md

Instructions for AI agents (Claude Code, Codex, Gemini) working **in this repository**.

## Project

reis-mobile is a Claude Code plugin with a Node.js CLI that orchestrates agents and skills for mobile development. Read [ARCHITECTURE.md](ARCHITECTURE.md) before changing the core.

## Rules

- **English only.** Agents, skills, commands, documentation, templates, comments and commit messages are written in English. Portuguese stays only where it is functional: the intent vocabulary in `core/router/intents.mjs` and the tests that cover Portuguese prompts.
- **Mobile first.** Every new agent, skill or command must directly help mobile development.
- **Zero dependencies.** `core/` and `bin/` use only the Node.js 22+ standard library. Do not add npm packages.
- **ES modules** (`.mjs`), 2 spaces, single quotes, semicolons.
- **Do not invent.** Skill checklists cite APIs, lints, flags and store requirements that actually exist. When in doubt, tell the model to check the version in the project's lock file instead of asserting it.
- **Every skill starts with `mobile-`, and there are two kinds.** A **topic** skill (`mobile-test`, `mobile-debug`, `mobile-firebase`...) covers every stack with `stacks: ["*"]`: `SKILL.md` holds what is true everywhere and a table pointing to `references/flutter.md`, `android.md`, `ios.md` and `react-native.md`. A **platform** skill (`mobile-flutter`, `mobile-android`, `mobile-ios`, `mobile-rn`) holds what exists only on that stack, grouped by theme in `references/<theme>.md`. A reference with a lot of material becomes an index plus a folder (`references/android.md` → `references/android/<subtopic>.md`), so the model loads only what the task needs. Add to an existing skill before creating a new one. `reis-mobile validate` enforces the names and stacks, and tests check that every platform reference is linked and every relative link resolves.
- **Focused references.** A reference solves one problem (`references/ios/cocoapods.md`, `references/flutter/riverpod.md`); a skill is a topic or a platform, not a whole domain (`mobile-development`).
- **Third-party skills** are added as references of the matching reis-mobile skill: their instructions stay as upstream wrote them, with an attribution line at the top (`> Adapted from the \`<name>\` skill in [owner/repo](url) (License).`), whole folders when they ship extra files (`GUIDE.md` plus their references and scripts), and an entry in `THIRD_PARTY_NOTICES.md` with the license text. A test fails when an adapted file is not credited.
- Every agent and skill declares `intents` and `stacks` in the frontmatter, or `routing: manual`.
- Changes to the detector, the router or the redaction require a test in `tests/`.

## Verification

```bash
npm run check    # validate + test
```

## Adding components

| I want... | Create | And also |
|---|---|---|
| Guidance for a topic that exists on several stacks | `references/<platform>.md` in the matching `skills/mobile-<topic>/`, or a new `mobile-<topic>` with `stacks: ["*"]` | Link it from `SKILL.md` |
| Guidance that exists on one stack only | `references/<theme>.md` in `skills/mobile-flutter`, `mobile-android`, `mobile-ios` or `mobile-rn` | Link it from the skill's topic table |
| An agent | `agents/<name>.md` | A routing test for the intent |
| A command | `commands/<name>.md` (becomes `/reis-mobile:<name>`) | Documentation in the README |
| An intent | Terms in `core/router/intents.mjs` | Cases in `tests/intent-detector.test.mjs` |
| A stack | Rule in `stack-detector.mjs` + `stacks/<id>/stack.json` | Cases in `tests/stack-detector.test.mjs` |
