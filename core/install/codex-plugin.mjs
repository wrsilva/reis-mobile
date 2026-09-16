import { spawnSync } from 'node:child_process';

import { LEGACY_PLUGIN_IDS, MARKETPLACE_NAME, MARKETPLACE_URL, PLUGIN_ID } from './claude-plugin.mjs';

/**
 * Registers the reis-mobile marketplace and installs the plugin through the `codex` CLI.
 *
 * `marketplace add` and `plugin add` are idempotent in Codex. `marketplace upgrade` only
 * accepts Git marketplaces, so it is skipped for a local `source`; it refreshes a snapshot
 * that predates the latest release, which otherwise fails with "not found in marketplace".
 */
export function installCodexPlugin({ source = MARKETPLACE_URL, run = runCodex, list = listCodexPlugins } = {}) {
  const result = runSteps(run, [
    ['plugin', 'marketplace', 'add', source],
    ...(isGitSource(source) ? [['plugin', 'marketplace', 'upgrade', MARKETPLACE_NAME]] : []),
    ['plugin', 'add', PLUGIN_ID],
  ]);
  if (!result.ok) return result;
  const installed = list().plugins;
  return runSteps(run, LEGACY_PLUGIN_IDS.filter((id) => installed.includes(id)).map((id) => ['plugin', 'remove', id]));
}

/** `marketplace remove` fails when the marketplace is not configured, so it only runs when it is. */
export function uninstallCodexPlugin({ run = runCodex, list = listCodexPlugins } = {}) {
  const { plugins, marketplaces } = list();
  return runSteps(run, [
    ...[PLUGIN_ID, ...LEGACY_PLUGIN_IDS].filter((id) => plugins.includes(id)).map((id) => ['plugin', 'remove', id]),
    ...(marketplaces.includes(MARKETPLACE_NAME) ? [['plugin', 'marketplace', 'remove', MARKETPLACE_NAME]] : []),
  ]);
}

function isGitSource(source) {
  return /^(https?:\/\/|git@|ssh:\/\/)/.test(source);
}

function runSteps(run, steps) {
  for (const args of steps) {
    const status = run(args);
    if (status !== 0) return { ok: false, failedStep: `codex ${args.join(' ')}`, status };
  }
  return { ok: true };
}

function runCodex(args) {
  const result = spawnSync('codex', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

/** Installed plugin ids and configured marketplace names. Unreadable output means neither. */
function listCodexPlugins() {
  return {
    plugins: readJson(['plugin', 'list', '--json'], (data) => data.installed.map((plugin) => plugin.pluginId)),
    marketplaces: readJson(['plugin', 'marketplace', 'list', '--json'], (data) => data.marketplaces.map((marketplace) => marketplace.name)),
  };
}

function readJson(args, pick) {
  const result = spawnSync('codex', args, { encoding: 'utf8', shell: process.platform === 'win32' });
  if (result.status !== 0) return [];
  try {
    return pick(JSON.parse(result.stdout));
  } catch {
    return [];
  }
}
