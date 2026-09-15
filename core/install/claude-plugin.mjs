import { spawnSync } from 'node:child_process';

export const MARKETPLACE_NAME = 'reis-mobile';
export const PLUGIN_ID = `reis-mobile@${MARKETPLACE_NAME}`;
export const MARKETPLACE_URL = 'https://github.com/wrsilva/reis-mobile.git';
export const SCOPES = ['user', 'project', 'local'];

/**
 * Registers the reis-mobile marketplace and installs the plugin through the `claude` CLI.
 * Both steps are idempotent in Claude Code, so running `init` twice is safe.
 *
 * `source` is the GitHub repository by default, so `claude plugin update` keeps working;
 * pass a local directory for offline or development installs.
 */
export function installClaudePlugin({ source = MARKETPLACE_URL, scope = 'user', run = runClaude } = {}) {
  assertScope(scope);
  return runSteps(run, [
    ['plugin', 'marketplace', 'add', source, '--scope', scope],
    ['plugin', 'install', PLUGIN_ID, '--scope', scope],
  ]);
}

export function uninstallClaudePlugin({ scope = 'user', run = runClaude } = {}) {
  assertScope(scope);
  return runSteps(run, [
    ['plugin', 'uninstall', PLUGIN_ID, '--scope', scope],
    ['plugin', 'marketplace', 'remove', MARKETPLACE_NAME],
  ]);
}

function runSteps(run, steps) {
  for (const args of steps) {
    const status = run(args);
    if (status !== 0) return { ok: false, failedStep: `claude ${args.join(' ')}`, status };
  }
  return { ok: true };
}

function assertScope(scope) {
  if (!SCOPES.includes(scope)) throw new Error(`Unknown scope "${scope}". Use one of: ${SCOPES.join(', ')}`);
}

function runClaude(args) {
  // npm-based Claude Code installs expose `claude.cmd` on Windows, which needs a shell.
  const result = spawnSync('claude', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error?.code === 'ENOENT') {
    throw new Error('Claude Code CLI not found in PATH. Install it from https://claude.com/claude-code and run `reis-mobile init` again.');
  }
  if (result.error) throw result.error;
  return result.status ?? 1;
}
