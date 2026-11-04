---
description: Structured debate between the mobile specialists — lead-mobile selects the participants, specialists defend and rebut positions, and lead-mobile returns to decide
argument-hint: "[--rounds N] [--agents a,b,c] [--external] [--providers a,b] <question>"
allowed-tools: ["Bash(node:*)", "Bash(mkdir:*)", "Agent", "Read", "Write", "Grep", "Glob"]
---

# reis-mobile debate

Arguments received: `$ARGUMENTS`

Use this command for mobile decisions with real trade-offs, including architecture, UI/UX, accessibility and release readiness. A debate runs several specialists over the configured rounds; avoid it for routine questions. If the question has a single answer that can be verified in the code, answer it directly and tell the user why it was not worth a debate.

## 1. Parse the arguments

| Flag | Default | Effect |
|---|---|---|
| `--rounds N` | 2 | Number of rounds, from 1 to 3. Above 3, warn and use 3. |
| `--agents a,b,c` | automatic | Explicit participants, using the names from the table in step 3. |
| `--external` | off | Adds every ready external provider to the debate. |
| `--providers a,b` | every ready one | Explicit provider ids; implies `--external`. |

Whatever remains is the question, as free text. Without a question, explain the usage and stop.

## 2. Gather the context

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" detect --dir "$PWD" --json
```

The JSON carries the stack and the `language` for the whole debate: `en` English, `pt` Brazilian Portuguese, `null` the language of the user's question. Use it in the announcements, the briefings, every round file and the synthesis, so participants write in it too. Code, identifiers and file paths stay as they are.

If the question mentions files or directories, resolve the paths and read them now: participants receive the content in the briefing, not the path. If it fails, show the error and stop.

## 3. Lead selects the participants

Invoke `Agent(subagent_type: "reis-mobile:lead-mobile", model: "opus")` with `phase: selection`, following the **Debate selection** section of `${CLAUDE_PLUGIN_ROOT}/agents/lead-mobile.md`. Pass the question, detected stack and native targets, language, relevant file contents, flags and the complete candidate/model table below. The lead owns participant selection; the command executes the returned plan and does not independently replace participants.

Ask the lead to choose **three** distinct specialists automatically, with relevant perspectives that can expose the question's trade-offs. Disagreement must come from evidence and competing constraints, not a requirement to invent conflict. Every specialist in the plugin is eligible; the lead itself is the selector and moderator, not a debater.

| Agent | Defends | Model |
|---|---|---|
| `reis-mobile:flutter-architect` | Layer boundaries, modularization, long-term maintenance cost | `opus` |
| `reis-mobile:flutter-performance-engineer` | Frames, rebuilds, memory, startup time — hostile to indirection | `sonnet` |
| `reis-mobile:flutter-test-engineer` | Testability, injection seams, coverage cost | `sonnet` |
| `reis-mobile:android-architect` | Native Android layers, Gradle modularization, long-term maintenance cost | `opus` |
| `reis-mobile:android-performance-engineer` | Recomposition, ANRs, startup, memory — hostile to indirection | `sonnet` |
| `reis-mobile:android-test-engineer` | Testability, injected dispatchers and fakes, coverage cost | `sonnet` |
| `reis-mobile:ios-architect` | Native iOS structure, packages, concurrency isolation | `opus` |
| `reis-mobile:ios-performance-engineer` | Hangs, view updates, launch time, retain cycles | `sonnet` |
| `reis-mobile:ios-test-engineer` | Testability, protocol seams, coverage cost | `sonnet` |
| `reis-mobile:rn-architect` | Feature boundaries, server vs client state, native module isolation | `opus` |
| `reis-mobile:rn-performance-engineer` | Re-renders, lists, JavaScript thread, startup | `sonnet` |
| `reis-mobile:rn-test-engineer` | Testability through the UI, mocks at boundaries, coverage cost | `sonnet` |
| `reis-mobile:kmp-architect` | Shared source-set ownership, host API contracts and migration cost | `opus` |
| `reis-mobile:kmp-performance-engineer` | Shared Kotlin cost versus Android/iOS host traces and bridge overhead | `sonnet` |
| `reis-mobile:kmp-test-engineer` | Common and target tests, host integration and coverage gaps | `sonnet` |
| `reis-mobile:plugin-native-expert` | Flutter–native boundary, platform channels, lifecycle | `opus` |
| `reis-mobile:mobile-staff-engineer` | Build, release, migration, cross-platform trade-offs | `opus` |
| `reis-mobile:mobile-code-reviewer` | Concrete risk in the code that already exists | `sonnet` |
| `reis-mobile:mobile-ui-ux-designer` | User journeys, visual hierarchy, interaction cost and design consistency | `opus` |
| `reis-mobile:mobile-accessibility-auditor` | Assistive interaction, readable content, focus and inclusive task completion | `sonnet` |
| `reis-mobile:mobile-release-engineer` | Artifact provenance, release gates, rollout and production readiness | `opus` |

Pass the `model` from the table on each participant's `Agent` call. The lead uses `opus` for both selection and synthesis. Model diversity is a configured perspective check, not proof of independent reasoning or correct conclusions.

Automatic selection must end with **at least two different models** among the participants. The lead must choose a relevant adjacent specialist using the other model when needed and explain the trade-off. If no relevant mixed-model trio fits the evidence, the lead reports that limitation instead of adding an unrelated role; resolve the scope before launching rounds.

Selection rules:

- The detected stack rules. Match `flutter-*` to Flutter, `android-*` to native Android, `ios-*` to native iOS, `rn-*` to React Native and `kmp-*` Kotlin Multiplatform. For architecture questions, consider the stack's architect, performance and test specialists. For design, accessibility or release questions, prioritize the corresponding cross-stack specialists. All `mobile-*` specialists fit any stack; native specialists may join cross-platform projects when the question implicates their native paths.
- Select `plugin-native-expert` only for Flutter projects with an implicated native bridge or plugin path.
- `--agents` overrides automatic membership, but not the models. The lead validates the supplied names (with or without the `reis-mobile:` prefix), requires at least two distinct specialists and preserves valid explicit choices. Unknown names, duplicates or the lead as a participant: explain the error and stop before rounds. An explicit same-model selection is allowed; disclose that limitation without substituting participants.
- `reis-mobile:lead-mobile` never debates: it selects in step 3 and returns to moderate in step 7. Neither lead call launches participants or external providers.

The lead returns a selection plan containing each participant's exact name, model, assigned question, rationale and evidence scope, plus unresolved constraints. Check the returned names/models against the table, uniqueness, explicit membership and the automatic model mix. If invalid, return the validation errors to the lead for correction before starting; do not silently repair its choices. If Agent delegation is unavailable, report that the debate could not run rather than claiming specialists participated.

Before starting, tell the user in one line the stack, the lead-selected participants with their models and the number of rounds.

## 4. Prepare the folder

```bash
mkdir -p ".reis-mobile/debates/<NNN-question-slug>/rounds"
```

`NNN` is sequential within `.reis-mobile/debates/`. Write `context.md` in the folder with the question, the stack, the language, the participants, the flags, the lead's selection plan with its rationale and the context read in step 2.

## 5. Round 1 — blind positions

Launch the participants **in parallel**, each with `Agent(subagent_type: "<agent>", model: "<model from the table>", run_in_background: true)`, in a single tool block. Pass each specialist its assigned question and evidence scope from the lead's plan. Instruct every participant to return analysis only, without editing app code or launching subagents. Nobody sees anyone else's position in this round: that is what keeps the first to answer from anchoring the rest.

Each briefing, self-contained:

```text
You are taking part in a technical debate as <agent role>.

QUESTION: <question>
STACK: <detected stack>
LANGUAGE: <language — write your position in it>
CONTEXT: <content of the relevant files>

Defend the position your specialty supports, in at most 400 words.
Cover: your recommendation, the evidence in the code that supports it, what you
give up by choosing it, and the condition that would change your mind.
Ground every claim in file:line. Do not write what you have not verified.

Write your position to: .reis-mobile/debates/<id>/rounds/r1_<agent>.md
```

### 5.1 External providers (only with `--external` or `--providers`)

Ask the core which providers can answer, instead of probing for executables yourself:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" providers --dir "$PWD" --all
```

`ready` providers can be used now; `missing`, `local`, `disabled` and `blocked` state what each one needs, and `blocked` means the repository's `providers:` allowlist excludes it — a team decision you do not work around. With no ready provider, carry on with the agents alone: their absence is informative, not an error. State at the opening who joined and who was missing.

Write the same briefing you gave the agents to `rounds/r<N>_briefing.md` with the Write tool — a file, so nothing depends on shell quoting — and send it:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" consult --dir "$PWD" \
  --file ".reis-mobile/debates/<id>/rounds/r<N>_briefing.md" [--providers <ids>]
```

The CLI performs the call, so no API key passes through this conversation, and the briefing is masked by the redaction layer before it leaves the process. Write each answer to `rounds/r<N>_<provider>.md` with the Write tool, keeping the provider id and the status from the output header. Treat a `timeout`, `error` or `no-model` status as a participant that did not answer this round.

They do not have the plugin skills and do not know the project: the briefing carries the entire context, and the output is an outside opinion to be checked against the code before it enters the synthesis. In round 2 they receive the others' positions exactly as the agents do.

## 6. Round 2 — rebuttal

For every round after the first, launch the same participants again, in parallel and with the same models as round 1 — changing a participant's model mid-debate changes the debater, and the rebuttal is no longer theirs. Now each one receives the others' positions:

```text
These are the other participants' positions from the previous round:

<content of each r<N-1>_*.md>

Attack the specific points you disagree with, citing who said them and
verifying the claim in the code. Where they are right and you were wrong,
say so. At most 300 words, in the same language as round 1.

Write to: .reis-mobile/debates/<id>/rounds/r<N>_<agent>.md
```

Rebutting the generic thesis does not count: every rebuttal cites a concrete claim from another participant. If a participant only repeats the previous round without engaging, record that and discount their weight in the synthesis.

## 7. Synthesis

Invoke `Agent(subagent_type: "reis-mobile:lead-mobile", model: "opus")` again with `phase: synthesis`, the selection plan, original context, all completed rounds and any missing/failed participant statuses, following the **Debate moderation** section of `${CLAUDE_PLUGIN_ROOT}/agents/lead-mobile.md`. It reads the rounds, verifies decisive evidence, resolves the disagreements and delivers the decision with an ordered action plan. This call does not select new participants or start additional rounds.

Before accepting the synthesis, confirm any decisive claim in the code yourself: participants do not verify each other. Write the result to `.reis-mobile/debates/<id>/synthesis.md`.

## 8. Present

Show the synthesis in the chat, in this order: the decision first, then the disagreements that produced it, then the action plan. Close with the path to the debate folder.

Do not apply any code change. The debate ends in a recommendation; implementing it is a new request.
