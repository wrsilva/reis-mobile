import { spawnSync } from 'node:child_process';

import { installClaudePlugin, uninstallClaudePlugin } from './claude-plugin.mjs';
import { installCodexPlugin, uninstallCodexPlugin } from './codex-plugin.mjs';

/** Every tool `reis-mobile init` registers the plugin in, when its CLI is on the PATH. */
export const TARGETS = [
  {
    id: 'claude',
    name: 'Claude Code',
    bin: 'claude',
    install: ({ source, scope }) => installClaudePlugin({ source, scope }),
    uninstall: ({ scope }) => uninstallClaudePlugin({ scope }),
  },
  {
    id: 'codex',
    name: 'Codex',
    bin: 'codex',
    install: ({ source }) => installCodexPlugin({ source }),
    uninstall: () => uninstallCodexPlugin(),
  },
];

/**
 * Installs (or removes) the plugin in each tool that is available, and never stops at the
 * first failure: one broken tool must not keep the plugin out of the other.
 *
 * Returns one entry per target: `skipped` when its CLI is missing, otherwise `ok` plus the
 * failing step. `ok` is false overall when a tool failed or none was found.
 */
export function runInit({ uninstall = false, source, scope = 'user', targets = TARGETS, exists = commandExists } = {}) {
  const results = targets.map((target) => {
    if (!exists(target.bin)) return { id: target.id, name: target.name, skipped: true };
    const options = { scope, ...(source && { source }) };
    const result = uninstall ? target.uninstall(options) : target.install(options);
    return { id: target.id, name: target.name, ...result };
  });
  const ran = results.filter((result) => !result.skipped);
  return { ok: ran.length > 0 && ran.every((result) => result.ok), results };
}

export function commandExists(bin) {
  const result = spawnSync(bin, ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' });
  // Through a Windows shell a missing command is exit code 1 (cmd) instead of ENOENT.
  return !result.error && !(process.platform === 'win32' && result.status !== 0);
}
