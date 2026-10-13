---
description: Second opinion from external providers — builds a stack-aware briefing, sends it through the provider layer and reconciles every outside claim against the code
argument-hint: "[--providers a,b] [--model <id>] [--files a,b] <question>"
allowed-tools: ["Bash(node:*)", "Read", "Grep", "Glob", "Write"]
---

# reis-mobile consult

Arguments received: `$ARGUMENTS`

Use this command when a mobile decision or finding deserves a model that does not share this session's blind spots: a migration you are unsure about, a diagnosis you cannot confirm, a trade-off where you suspect you are anchored. For a question the code answers on its own, answer it directly and say why a consult was not worth it.

**This sends project context to a third party.** Everything in the briefing leaves the session, including the excerpts of the files you include. Name the providers that will receive it before sending, and never include a credential, a store key or a `.env` value.

## 1. Parse the arguments

| Flag | Default | Effect |
|---|---|---|
| `--providers a,b` | every ready provider | Explicit provider ids, from step 2. |
| `--model <id>` | per-provider configuration | Model for the selected HTTP providers. |
| `--files a,b` | files named in the question | Extra files to include in the briefing. |
| `--timeout <ms>` | 120000 | How long to wait for each provider. |

Whatever remains is the question, as free text. Without a question, explain the usage and stop.

## 2. Check who can answer

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" providers --dir "$PWD" --all
```

`ready` providers can be used now. `missing` ones state the executable or the credential they need, `local` needs a server running, `disabled` is off in the user config and `blocked` is not in the `providers:` allowlist of `.reis-mobile/config.yaml` — a team decision, which you do not work around. With no ready provider, show what each one needs and stop.

## 3. Route the question and gather the evidence

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" route --dir "$PWD" -- "<question>"
```

Use the `Language` line for everything the user reads (`en` English, `pt` Brazilian Portuguese; `-` means the language of the request). Read the selected agent and skills as `/reis-mobile:review` does, then resolve the paths in the question and in `--files` and read them. External providers receive content, never paths: they cannot open your repository.

**Form your own position first.** Write it down before sending anything. A consult that starts without one turns into agreement with whatever comes back.

## 4. Write the briefing

```bash
mkdir -p ".reis-mobile/consults/<NNN-question-slug>"
```

`NNN` is sequential within `.reis-mobile/consults/`. Write `briefing.md` in that folder with the Write tool, self-contained:

```text
QUESTION: <question>
STACK: <detected stack, variant and platforms>
LANGUAGE: <language — answer in it>
CODE: <the relevant excerpts, with file:line for each>
CONSTRAINTS: <versions, SDK targets, deadlines or rules that limit the answer>

You do not have access to this repository: everything you need is above.
Answer in at most 500 words: your recommendation, the evidence in the excerpts that
supports it, what it costs, and what would change your mind. Say explicitly when the
excerpts are not enough to decide.
```

## 5. Consult

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/reis-mobile.mjs" consult --dir "$PWD" \
  --file ".reis-mobile/consults/<id>/briefing.md" \
  [--providers <ids>] [--model <id>] [--timeout <ms>]
```

The CLI performs the call, so no API key passes through this conversation; the question is masked by the redaction layer on the way out and every answer on the way in. Each block is headed by the provider, its model, its status and its duration. A `no-model`, `timeout`, `unavailable` or `error` status is information to report, not a failure to retry blindly — retry once at most, and only for `timeout`.

## 6. Reconcile against the code

External answers do not know this project and have no reis-mobile skills. For every claim that matters:

- confirm it in the code and cite `file:line`;
- mark as **unverifiable** what the excerpts cannot settle;
- mark as **wrong** what the code contradicts, with the evidence.

A claim that only repeats the briefing back adds nothing. Do not adopt a recommendation because several providers agree: they may share a training bias that your code does not.

## 7. Report

In this order:

1. **Decision** — your recommendation, with the reason, in one paragraph.
2. **Where the providers agreed with you** and where they did not, naming each one.
3. **Confirmed claims** with `file:line`, then **unverifiable** and **wrong** ones.
4. **Action plan**, if the decision implies work.
5. The briefing path and the providers that received it.

Do not apply any code change: a consult ends in a recommendation. Implementing it is a new request.
