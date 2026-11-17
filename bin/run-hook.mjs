#!/usr/bin/env node
// Claude Code PreToolUse hook. It runs before every Bash call, so it stays cheap: unless
// `reis-mobile hook on` enabled it, it reads the config and exits without output. When on, it
// routes recognized mobile build and test commands through `reis-mobile run`.
import { isRunHookEnabled } from '../core/run/settings.mjs';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', async () => {
  try {
    if (!(await isRunHookEnabled())) return;
    const { handlePreToolUse } = await import('../core/run/hook.mjs');
    const output = handlePreToolUse(JSON.parse(input), { enabled: true });
    if (output) process.stdout.write(JSON.stringify(output));
  } catch {
    // A hook must never block the tool call; leave the command unchanged.
  }
});
