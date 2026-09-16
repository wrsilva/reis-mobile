---
description: Structured debate between the mobile specialists — each agent defends its perspective, rebuts the others, and lead-mobile decides
argument-hint: "[--rounds N] [--agents a,b,c] [--external] <question>"
allowed-tools: ["Bash(node:*)", "Bash(command:*)", "Bash(mkdir:*)", "Bash(codex:*)", "Bash(gemini:*)", "Agent", "Read", "Write", "Grep", "Glob"]
---

# reis-mobile debate

Arguments received: `$ARGUMENTS`

Use this command for architecture decisions with real trade-offs, not for routine questions: every debate costs several agents across two rounds. If the question has a single answer that can be verified in the code, answer it directly and tell the user why it was not worth a debate.

## 1. Parse the arguments

| Flag | Default | Effect |
|---|---|---|
| `--rounds N` | 2 | Number of rounds, from 1 to 3. Above 3, warn and use 3. |
| `--agents a,b,c` | automatic | Explicit participants, using the names from the table in step 3. |
| `--external` | off | Adds Codex and Gemini to the debate, when installed. |

Whatever remains is the question, as free text. Without a question, explain the usage and stop.

## 2. Gather the context

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" detect --dir "$PWD" --json
```

The JSON carries the stack and the `language` for the whole debate: `en` English, `pt` Brazilian Portuguese, `null` the language of the user's question. Use it in the announcements, the briefings, every round file and the synthesis, so participants write in it too. Code, identifiers and file paths stay as they are.

If the question mentions files or directories, resolve the paths and read them now: participants receive the content in the briefing, not the path. If it fails, show the error and stop.

## 3. Pick the participants

Choose **three** agents whose priorities genuinely conflict on the question. A debate between roles that agree produces no decision.

| Agent | Defends | Model |
|---|---|---|
| `reis-mobile:flutter-architect` | Layer boundaries, modularization, long-term maintenance cost | `opus` |
| `reis-mobile:flutter-performance-engineer` | Frames, rebuilds, memory, startup time — hostile to indirection | `sonnet` |
| `reis-mobile:flutter-test-engineer` | Testability, injection seams, coverage cost | `sonnet` |
| `reis-mobile:plugin-native-expert` | Flutter–native boundary, platform channels, lifecycle | `opus` |
| `reis-mobile:mobile-staff-engineer` | Build, release, migration, cross-platform trade-offs | `opus` |
| `reis-mobile:mobile-code-reviewer` | Concrete risk in the code that already exists | `sonnet` |

Pass the `model` from the table on every `Agent` call. It overrides the `model: inherit` the agents declare, and that is what keeps the debate from turning into a monologue: with everyone on the same model, participants inherit the same biases and the same blind spots, and the disagreement stays on the surface of the role. The table pairs model strength with role — `opus` where the question is a long-term trade-off, `sonnet` where it is concrete implementation detail.

Automatic selection must end with **at least two different models** among the participants. If the question leads to three agents on the same model, swap one of them for the most relevant adjacent agent that uses the other model, and tell the user you did so.

Selection rules:

- The detected stack rules. The `flutter-*` agents only join Flutter projects; in native Android or iOS, use `mobile-staff-engineer` and `mobile-code-reviewer`.
- Without native code in the project, do not call `plugin-native-expert`.
- `--agents` overrides the automatic choice, but not the models: each agent keeps the one from the table. Unknown name: warn and stop.
- `reis-mobile:lead-mobile` never debates — it moderates in step 7, always on `opus`, because synthesizing conflicting positions is the heaviest work in the flow.

Before starting, tell the user in one line the stack, the participants with their models and the number of rounds.

## 4. Prepare the folder

```bash
mkdir -p ".reis-mobile/debates/<NNN-question-slug>/rounds"
```

`NNN` is sequential within `.reis-mobile/debates/`. Write `context.md` in the folder with the question, the stack, the language, the participants, the flags and the context read in step 2.

## 5. Round 1 — blind positions

Launch the participants **in parallel**, each with `Agent(subagent_type: "<agent>", model: "<model from the table>", run_in_background: true)`, in a single tool block. Nobody sees anyone else's position in this round: that is what keeps the first to answer from anchoring the rest.

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

### 5.1 External providers (only with `--external`)

Check before calling, and carry on without them if they are missing — their absence is informative, not an error:

```bash
command -v codex >/dev/null 2>&1 && echo codex
command -v gemini >/dev/null 2>&1 && echo gemini
```

If present, call them in parallel with the agents, writing to `r1_codex.md` and `r1_gemini.md`:

```bash
codex exec --full-auto "<briefing>"
printf '%s' "<briefing>" | gemini -p "" -o text --approval-mode yolo
```

They do not have the plugin skills and do not know the project: give the entire context in the briefing and treat the output as an outside opinion, to be checked against the code before it enters the synthesis. State at the opening who joined and who was missing.

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

Invoke `reis-mobile:lead-mobile` with all rounds, following the **Debate moderation** section of `${CLAUDE_PLUGIN_ROOT}/agents/lead-mobile.md`. It resolves the disagreements and produces the action plan.

Before accepting the synthesis, confirm any decisive claim in the code yourself: participants do not verify each other. Write the result to `.reis-mobile/debates/<id>/synthesis.md`.

## 8. Present

Show the synthesis in the chat, in this order: the decision first, then the disagreements that produced it, then the action plan. Close with the path to the debate folder.

Do not apply any code change. The debate ends in a recommendation; implementing it is a new request.
