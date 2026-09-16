---
description: Mobile code review — detects the stack, selects the right agent and skills, and reviews the changes (or the whole project)
argument-hint: "[--base <ref>] [review focus]"
allowed-tools: ["Bash(node:*)", "Bash(git:*)", "Read", "Grep", "Glob"]
---

# mobile review

Arguments received: `$ARGUMENTS`

## 1. Route and gather context

Extract the `--base <ref>` option from the arguments (if present). The rest is the review focus, as free text. Run via Bash, with correct quoting:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/mobile.mjs" review --dir "$PWD" [--base <ref>] -- "<review focus>"
```

The output reports:

- `Intent`, `Stack` and `focus` (native platforms mentioned in the focus);
- `Agent`: the responsible agent;
- `Skills`: the skills to apply, in priority order;
- `Language`: the language to answer in (see **Language**);
- `Context`: `working-tree`, `range` or `project`, with the list of changed files and the diff (secrets already masked).

If the command fails, show the error to the user and stop.

## Language

The CLI output has a `Language` line (`language` in JSON). Write everything the user reads — the answer, report headings and text, syntheses and files you create — in that language: `en` is English, `pt` is Brazilian Portuguese. With `-` or `null`, use the language of the user's request. Code, identifiers, file paths, commands and quoted tool output stay as they are.

## 2. Load the instructions

Read with the Read tool, in this order:

1. `${CLAUDE_PLUGIN_ROOT}/agents/<Agent>.md`: role, process, rules and report format;
2. `${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md` for each listed skill.

## 3. Review

Follow the agent's process, applying the skills' checklists:

- **working-tree / range:** review the changed files. Read the full file when the diff does not give enough context. `untracked` files do not appear in the diff: read them directly. If the diff was truncated, read the remaining files.
- **project:** there are no changes; audit the project starting from the entry points and the data layer.

Confirm every finding in the code before reporting it. Do not modify files: this is a review.

## 4. Report

Answer in the format defined by the agent (Summary, Critical, Bugs, Architecture, Security, Performance, Maintainability, Suggested changes), translating the headings when the language is not English. On the first line of the Summary, state the stack, the agent and the skills used, so the routing is visible.

If the router emitted warnings (lines starting with `!`), mention them in the Summary.
