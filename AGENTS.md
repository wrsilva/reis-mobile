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
- **One skill per topic, one reference per platform.** When a topic exists on several stacks (tests, Firebase, push notifications), create a single `mobile-<topic>` skill with `stacks: ["*"]`: `SKILL.md` holds what is true on every platform and a table pointing to `references/flutter.md`, `references/android.md`, `references/ios.md` and `references/react-native.md`. A platform with a lot of material gets an index file plus a folder (`references/android.md` → `references/android/<subtopic>.md`), so the model loads only what the task needs. Stack-prefixed skills (`android-gradle-build-debug`, `ios-cocoapods-debug`) are only for problems that exist on one platform. Tests check that every platform reference is linked and every relative link resolves.
- **Focused skills.** A skill solves one topic (`mobile-code-review`, `android-gradle-build-debug`), not a whole domain (`mobile-development`).
- **Stack-prefixed names**: every skill starts with the prefix of its stack — `flutter-*`, `android-*`, `ios-*`, `rn-*` — and stack-agnostic skills (`stacks: ["*"]`) start with `mobile-*`. `reis-mobile validate` rejects a skill that does not. Agents follow the same prefixes for stack specialists.
- **Third-party skills** are renamed to the stack prefix when needed, declare `source` and `license` in the frontmatter and appear in `THIRD_PARTY_NOTICES.md` with the license text and their upstream name. Only the folder and the `name` field change; the instructions stay as upstream wrote them. Only import from sources whose license allows redistribution, and never copy agents or skills containing customer data, local paths or proprietary code.
- Every agent and skill declares `intents` and `stacks` in the frontmatter, or `routing: manual`.
- Changes to the detector, the router or the redaction require a test in `tests/`.

## Verification

```bash
npm run check    # validate + test
```

## Adding components

| I want... | Create | And also |
|---|---|---|
| A skill | `skills/mobile-<topic>/SKILL.md` + `references/<platform>.md`, or `skills/<stack>-<name>/SKILL.md` for a single-platform problem | A case in `tests/router.test.mjs` if it changes the selection for any route |
| An agent | `agents/<name>.md` | A routing test for the intent |
| A command | `commands/<name>.md` (becomes `/reis-mobile:<name>`) | Documentation in the README |
| An intent | Terms in `core/router/intents.mjs` | Cases in `tests/intent-detector.test.mjs` |
| A stack | Rule in `stack-detector.mjs` + `stacks/<id>/stack.json` | Cases in `tests/stack-detector.test.mjs` |
