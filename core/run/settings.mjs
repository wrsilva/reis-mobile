import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { configPath, readConfig } from '../config/language.mjs';

/** Whether the optional Claude Code hook routes mobile commands through `reis-mobile run`. */
export async function isRunHookEnabled(path = configPath()) {
  try {
    return (await readConfig(path)).runHook === true;
  } catch {
    return false;
  }
}

export async function setRunHook(enabled, path = configPath()) {
  const config = { ...(await readConfig(path)), runHook: Boolean(enabled) };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
  return config.runHook;
}
