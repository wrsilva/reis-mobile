#!/usr/bin/env node
// Claude Code PreToolUse hook. It runs before every Bash call, so it stays cheap: it reads the
// switches and exits without output unless one applies.
//   guard (on by default)  a command that never ends (flutter run, emulator, react-native start,
//                          expo start, adb logcat) starts with `reis-mobile run --background`
//   hook (`reis-mobile hook on`)  recognized mobile build and test commands go through `reis-mobile run`
import { readRunSettings } from '../core/run/settings.mjs';

// Every never-ending command the guard handles names one of these tools.
const GUARDED_TOOLS = /flutter|emulator|logcat|react-native|rnc|expo|simctl/;

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', async () => {
  try {
    const settings = await readRunSettings();
    // Codex sets PLUGIN_ROOT; the guard's rewrite is verified against Claude Code only.
    const guard = settings.guard && !process.env.PLUGIN_ROOT && GUARDED_TOOLS.test(input);
    if (!settings.hook && !guard) return;
    const { handlePreToolUse } = await import('../core/run/hook.mjs');
    const output = handlePreToolUse(JSON.parse(input), { enabled: settings.hook, guard });
    if (output) process.stdout.write(JSON.stringify(output));
  } catch {
    // A hook must never block the tool call; leave the command unchanged.
  }
});
