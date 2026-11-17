#!/usr/bin/env node
// Claude Code SessionStart hook. In a mobile project it adds the progress and decisions rules
// to the session, on startup, resume, /clear and after compaction. Silent anywhere else.
// REIS_MOBILE_SESSION_CONTEXT=0 turns it off.

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', async () => {
  try {
    // Codex sets PLUGIN_ROOT; this output format is verified against Claude Code only.
    if (process.env.PLUGIN_ROOT) return;
    const { sessionContext } = await import('../core/session/context.mjs');
    const payload = input.trim() ? JSON.parse(input) : {};
    const context = await sessionContext(payload.cwd ?? process.cwd());
    if (context) {
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context } }));
    }
  } catch {
    // Session context is advisory and must never fail a session.
  }
});
