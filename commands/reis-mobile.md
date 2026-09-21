---
description: reis-mobile entry point — lists the commands or forwards to doctor, project, review, debug, test, release, debate or the right agent from a free-form request
argument-hint: "[doctor | project | review | debug | test | release | debate | free-form request]"
allowed-tools: ["Bash(node:*)", "Bash(git:*)", "Read", "Grep", "Glob", "Edit", "Write"]
---

# reis-mobile

Arguments received: `$ARGUMENTS`

Pick the case by the first word of the arguments.

## Language

The CLI output has a `Language` line (`language` in JSON). Write everything the user reads — the answer, report headings and text, syntheses and files you create — in that language: `en` is English, `pt` is Brazilian Portuguese. With `-` or `null`, use the language of the user's request. Code, identifiers, file paths, commands and quoted tool output stay as they are.

## No arguments

Reply only with this list. The only thing to run is `node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" lang`, to find the language:

```text
/reis-mobile:doctor                  Environment and project: SDKs, Xcode, CocoaPods, Gradle wrapper, lock files
/reis-mobile:project [feature]       Creates or refreshes a brief with actual app objects and team context
/reis-mobile:review [--base <ref>]   Code review of the changes (or the whole project)
/reis-mobile:debug <problem>         Finds the cause of a build or runtime failure and proposes the fix
/reis-mobile:test [request]          Runs, writes, audits or fixes tests using the project's test setup
/reis-mobile:release [request]       Audits store readiness with evidence and a go/no-go verdict
/reis-mobile:debate <question>       Debate between the specialists, with a decision by lead-mobile
/reis-mobile <free-form request>     Forwards the request to the agent and skills for the detected stack
```

When the language is `pt`, translate the descriptions and keep the commands as they are. When it is not set, use English.

## `doctor [options]`

1. Run via Bash: `node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" doctor --dir "$PWD" <options>`.
2. Read `${CLAUDE_PLUGIN_ROOT}/commands/doctor.md` and follow its **Instructions** section on that output.

## `project [feature]`

Read `${CLAUDE_PLUGIN_ROOT}/commands/project.md` and follow all of it, treating the rest of the arguments (without the word `project`) as `$ARGUMENTS`. This entry point has the same behavior as `/reis-mobile:project`.

## `review [options] [focus]`

Read `${CLAUDE_PLUGIN_ROOT}/commands/review.md` and follow all of it, treating the rest of the arguments (without the word `review`) as `$ARGUMENTS`.

## `debug <problem>`

Read `${CLAUDE_PLUGIN_ROOT}/commands/debug.md` and follow all of it, treating the rest of the arguments (without the word `debug`) as `$ARGUMENTS`.

## `debate [options] <question>`

Read `${CLAUDE_PLUGIN_ROOT}/commands/debate.md` and follow all of it, treating the rest of the arguments (without the word `debate`) as `$ARGUMENTS`.

## `test [request]`

Read `${CLAUDE_PLUGIN_ROOT}/commands/test.md` and follow all of it, treating the rest of the arguments (without the word `test`) as `$ARGUMENTS`. This entry point has the same behavior as `/reis-mobile:test`.

## `release [request]`

Read `${CLAUDE_PLUGIN_ROOT}/commands/release.md` and follow all of it, treating the rest of the arguments (without the word `release`) as `$ARGUMENTS`. This entry point has the same behavior as `/reis-mobile:release`.

## Any other text

It is a free-form request, in English or Portuguese.

1. Run via Bash, with correct quoting: `node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" route --dir "$PWD" -- "<request>"`. If it fails, show the error and stop.
2. Read `${CLAUDE_PLUGIN_ROOT}/agents/<Agent>.md` and, in order, `${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md` for each listed skill.
3. Handle the request following the agent's process and the skills' checklists. Confirm in the code everything you claim.
4. On the first line of the answer, state the stack, the agent and the skills used. If the router emitted warnings (lines starting with `!`), mention them.
