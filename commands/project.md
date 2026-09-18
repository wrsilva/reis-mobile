---
description: Build or refresh a project-specific mobile brief from actual app objects, boundaries and validation commands
argument-hint: "[feature or flow to prioritize]"
allowed-tools: ["Bash(node:*)", "Bash(git:*)", "Read", "Grep", "Glob", "Edit", "Write"]
---

# reis-mobile project

Arguments received: `$ARGUMENTS`

## Resolve the mobile app and profile

Run `node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" detect --json --dir "$PWD"`. Parse the JSON result; use `projectDir` as the app root. If `projectConfig` is present, place the profile at `.reis-mobile/project.md` beside that config file. Otherwise place it at `<projectDir>/.reis-mobile/project.md`. Do not write a profile for an unknown stack or a missing project root. Read `${CLAUDE_PLUGIN_ROOT}/docs/agent-context.md` before collecting evidence.

The optional arguments identify a feature or flow to prioritize, not a shell command. Never evaluate them as shell code. Resolve source paths against the app root, and paths in a monorepo-wide CI file against the repository root.

## Collect project evidence

Inspect applicable repository instructions, architecture docs, build manifests, lock files, source entry points, navigation, dependency wiring, two or three representative features and their nearest tests. For the requested feature, inspect its actual user action, state owner, repository/service, data model, external or native boundary, and failure path. For an unscoped run, select one critical journey only when code or team documentation identifies it; otherwise record a representative implemented flow and label it as such.

Use the detected stack and configured targets. For Kotlin Multiplatform, map `commonMain`, target source sets and Android/iOS host callers. Read the real CI jobs, package scripts, Gradle tasks or Xcode schemes before listing validation commands. Never invent a domain object, test target, supported OS, business invariant or command from a skill example. Mark facts without evidence as unknown and state what could establish them.

## Write or refresh the brief

Create the profile if absent. On refresh, replace only the content between these exact markers:

```markdown
<!-- reis-mobile:verified:start -->
## Verified code map
...
<!-- reis-mobile:verified:end -->
```

If an existing profile lacks the markers, preserve all existing text and append the marked block. Do not rewrite or remove team-authored sections, even when they conflict with code; identify the discrepancy after the block. Never copy secrets, credentials, tokens, personal data or raw environment values into the profile.

The verified block contains:

1. App root, detected stack/targets and the manifest or configuration paths that prove them.
2. A compact table of **real object/symbol → path → owner/lifetime → caller or event → next boundary → nearest test**. Mark an absent test as `none found`, not as a claim that no tests exist.
3. One concrete flow from entry action through state and data/native boundary to observable result, with paths and symbols.
4. Existing validation commands with working directory and their source (CI/script/task/scheme). Distinguish commands inspected from commands actually run.
5. Unknowns and stale references that require team confirmation.

For a new profile, add a short `## Team context` section after the verified block with prompts for product vocabulary, critical journeys, business invariants, supported environments and deliberate exceptions. Leave values as `Unknown — team input needed` until the team supplies them. Do not fabricate a product description.

## Report

State the profile path, the flow and objects recorded, evidence that was verified, commands actually run and the remaining unknowns. Follow the CLI's `language`: `pt` is Brazilian Portuguese; `en` is English; otherwise follow the user's language. Code identifiers, paths and quoted output remain unchanged.
