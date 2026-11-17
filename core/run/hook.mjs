import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';

import { PLUGIN_ROOT } from '../paths.mjs';
import { recognize, shellWords } from './tools.mjs';

const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=[^\s'"`$()]*$/;

/**
 * Finds the simple commands of a shell line, split on top-level &&, || and ;. Returns null
 * when the line uses constructs a textual rewrite could break: pipes, redirections,
 * subshells, command substitution, heredocs or background jobs.
 */
export function splitCommandLine(command) {
  const parts = [];
  let start = 0;
  let quote = null;
  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    if (quote) {
      if (char === quote) quote = null;
      else if (char === '\\' && quote === '"') i++;
      continue;
    }
    if (char === "'" || char === '"') { quote = char; continue; }
    if (char === '\\') { i++; continue; }
    if (char === '`' || char === '(' || char === ')' || char === '<' || char === '>' || char === '\n') return null;
    if (char === '$' && command[i + 1] === '(') return null;
    const two = command.slice(i, i + 2);
    if (two === '&&' || two === '||') {
      parts.push([start, i]);
      start = i + 2;
      i++;
      continue;
    }
    if (char === '|' || char === '&') return null;
    if (char === ';') {
      parts.push([start, i]);
      start = i + 1;
    }
  }
  if (quote) return null;
  parts.push([start, command.length]);
  return parts;
}

function onPath(name, env = process.env) {
  const dirs = (env.PATH ?? '').split(delimiter).filter(Boolean);
  const names = process.platform === 'win32' ? [`${name}.cmd`, `${name}.exe`, name] : [name];
  return dirs.some((dir) => names.some((candidate) => existsSync(join(dir, candidate))));
}

/**
 * The command prefix that runs `reis-mobile run` from this installation. A `reis-mobile` found
 * on PATH may be an older global install without `run`, so the hook never relies on it.
 */
export function runnerPrefix() {
  return `node "${join(PLUGIN_ROOT, 'bin', 'reis-mobile.mjs')}" run --`;
}

/** The prefix that starts a never-ending command detached and returns once it is ready. */
export function backgroundPrefix() {
  return `node "${join(PLUGIN_ROOT, 'bin', 'reis-mobile.mjs')}" run --background --`;
}

/**
 * Returns the command with each recognized mobile tool invocation routed through
 * `reis-mobile run`, or null when nothing should change.
 */
export function rewriteCommand(command, options = {}) {
  return planRewrite(command, options)?.command ?? null;
}

/**
 * Plans the rewrite of a Bash command line. With `compact`, recognized mobile commands go
 * through `reis-mobile run`; with `guard`, commands that never end on their own (flutter run,
 * emulator, react-native start...) go through `reis-mobile run --background` instead.
 *
 * @returns {{ command: string, compacted: string[], guarded: string[] } | null}
 */
export function planRewrite(command, { prefix = runnerPrefix(), background = backgroundPrefix(), compact = true, guard = false } = {}) {
  if (typeof command !== 'string' || !command.trim()) return null;
  if (/(^|[\s;&|])(reis-mobile(\.mjs)?|rtk)\s/.test(command) || command.includes('reis-mobile.mjs')) return null;
  const parts = splitCommandLine(command);
  if (!parts) return null;

  let result = '';
  let cursor = 0;
  const compacted = [];
  const guarded = [];
  for (const [start, end] of parts) {
    const text = command.slice(start, end);
    const words = shellWords(text);
    let skip = 0;
    while (skip < words.length && ASSIGNMENT.test(words[skip])) skip++;
    const profile = skip < words.length ? recognize(words.slice(skip)) : null;
    const insert = profile && guard && profile.endless ? background : profile && compact ? prefix : null;
    if (insert) {
      (insert === background ? guarded : compacted).push(profile.tool);
      // Insert the prefix after leading VAR=value assignments, which stay shell assignments.
      const leading = text.match(/^\s*/)[0].length;
      let offset = leading;
      for (let i = 0; i < skip; i++) {
        const at = text.indexOf(words[i], offset);
        offset = at + words[i].length;
        while (offset < text.length && /\s/.test(text[offset])) offset++;
      }
      result += command.slice(cursor, start) + text.slice(0, offset) + `${insert} ` + text.slice(offset);
    } else {
      result += command.slice(cursor, end);
    }
    cursor = end;
  }
  result += command.slice(cursor);
  return compacted.length || guarded.length ? { command: result, compacted, guarded } : null;
}

const COMPACT_REASON = 'reis-mobile run: compact output for a mobile build or test command';
const guardReason = (tools) => `reis-mobile run --background: ${[...new Set(tools)].join(', ')} does not end on its own, so it would block this call until it times out; it starts detached and the call returns when it is ready, fails or the wait ends, with progress, the PID, the log and the stop command`;

/** True when RTK is installed and its Claude Code hook would rewrite this tool call itself. */
function rtkWouldRewrite(input, env) {
  if (!onPath('rtk', env)) return false;
  const result = spawnSync('rtk', ['hook', 'claude'], { input: JSON.stringify(input), encoding: 'utf8', timeout: 1500, env });
  return result.status === 0 && /"updatedInput"/.test(result.stdout ?? '');
}

/**
 * Handles a Claude Code PreToolUse payload. Returns the hook output object, or null to leave
 * the tool call unchanged.
 *
 * `enabled` is `reis-mobile hook on` (compact output); `guard` is `reis-mobile hook guard`,
 * on by default. A call that already asks for `run_in_background` is not guarded: it does
 * not block the session.
 */
export function handlePreToolUse(input, { enabled, guard = false, env = process.env, prefix, background } = {}) {
  if (input?.tool_name !== 'Bash' || (!enabled && !guard)) return null;
  const plan = planRewrite(input.tool_input?.command, {
    prefix: prefix ?? runnerPrefix(),
    background: background ?? backgroundPrefix(),
    compact: Boolean(enabled),
    guard: guard && input.tool_input?.run_in_background !== true,
  });
  if (!plan) return null;
  if (rtkWouldRewrite(input, env)) {
    if (!plan.guarded.length) return null;
    // Two rewrites of one call conflict; blocking with the command to use is the safe answer.
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `${guardReason(plan.guarded)}. Run it as: ${plan.command}`,
      },
    };
  }
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecisionReason: [plan.compacted.length && COMPACT_REASON, plan.guarded.length && guardReason(plan.guarded)].filter(Boolean).join('; '),
      updatedInput: { ...input.tool_input, command: plan.command },
    },
  };
}
