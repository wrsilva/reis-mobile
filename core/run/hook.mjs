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

/**
 * Returns the command with each recognized mobile tool invocation routed through
 * `reis-mobile run`, or null when nothing should change.
 */
export function rewriteCommand(command, { prefix = runnerPrefix() } = {}) {
  if (typeof command !== 'string' || !command.trim()) return null;
  if (/(^|[\s;&|])(reis-mobile(\.mjs)?|rtk)\s/.test(command) || command.includes('reis-mobile.mjs')) return null;
  const parts = splitCommandLine(command);
  if (!parts) return null;

  let result = '';
  let cursor = 0;
  let changed = false;
  for (const [start, end] of parts) {
    const text = command.slice(start, end);
    const words = shellWords(text);
    let skip = 0;
    while (skip < words.length && ASSIGNMENT.test(words[skip])) skip++;
    if (skip < words.length && recognize(words.slice(skip))) {
      // Insert the prefix after leading VAR=value assignments, which stay shell assignments.
      const leading = text.match(/^\s*/)[0].length;
      let offset = leading;
      for (let i = 0; i < skip; i++) {
        const at = text.indexOf(words[i], offset);
        offset = at + words[i].length;
        while (offset < text.length && /\s/.test(text[offset])) offset++;
      }
      result += command.slice(cursor, start) + text.slice(0, offset) + `${prefix} ` + text.slice(offset);
      changed = true;
    } else {
      result += command.slice(cursor, end);
    }
    cursor = end;
  }
  result += command.slice(cursor);
  return changed ? result : null;
}

/** True when RTK is installed and its Claude Code hook would rewrite this tool call itself. */
function rtkWouldRewrite(input, env) {
  if (!onPath('rtk', env)) return false;
  const result = spawnSync('rtk', ['hook', 'claude'], { input: JSON.stringify(input), encoding: 'utf8', timeout: 1500, env });
  return result.status === 0 && /"updatedInput"/.test(result.stdout ?? '');
}

/**
 * Handles a Claude Code PreToolUse payload. Returns the hook output object, or null to leave
 * the tool call unchanged.
 */
export function handlePreToolUse(input, { enabled, env = process.env, prefix } = {}) {
  if (!enabled || input?.tool_name !== 'Bash') return null;
  const command = input.tool_input?.command;
  const rewritten = rewriteCommand(command, { prefix: prefix ?? runnerPrefix() });
  if (!rewritten) return null;
  if (rtkWouldRewrite(input, env)) return null;
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecisionReason: 'reis-mobile run: compact output for a mobile build or test command',
      updatedInput: { ...input.tool_input, command: rewritten },
    },
  };
}
