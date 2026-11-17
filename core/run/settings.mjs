import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { configPath, readConfig } from '../config/language.mjs';

/**
 * The Claude Code hook switches, stored next to the language setting.
 *
 *   hook   routes mobile build and test commands through `reis-mobile run` (off by default)
 *   guard  starts commands that never end with `reis-mobile run --background` (on by default)
 */
export async function readRunSettings(path = configPath()) {
  try {
    const config = await readConfig(path);
    return { hook: config.runHook === true, guard: config.runGuard !== false };
  } catch {
    return { hook: false, guard: true };
  }
}

/** Whether the optional Claude Code hook routes mobile commands through `reis-mobile run`. */
export async function isRunHookEnabled(path = configPath()) {
  return (await readRunSettings(path)).hook;
}

async function save(key, enabled, path) {
  const config = { ...(await readConfig(path)), [key]: Boolean(enabled) };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
  return config[key];
}

export const setRunHook = (enabled, path = configPath()) => save('runHook', enabled, path);
export const setRunGuard = (enabled, path = configPath()) => save('runGuard', enabled, path);
