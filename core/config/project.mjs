import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

import { parseYamlSubset } from '../registry/frontmatter.mjs';

export const PROJECT_CONFIG = join('.reis-mobile', 'config.yaml');

const KNOWN_KEYS = new Set(['app']);

/**
 * Finds the nearest `.reis-mobile/config.yaml`, starting at `dir` and walking up, so a
 * command run anywhere inside a monorepo sees the same settings.
 *
 * @returns {{ path: string, root: string, data: object } | null}
 */
export function findProjectConfig(dir) {
  let current = resolve(dir);
  for (;;) {
    const path = join(current, PROJECT_CONFIG);
    if (existsSync(path)) return { path, root: current, data: parseYamlSubset(readFileSync(path, 'utf8')) };
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/**
 * The directory commands should analyze. `app: apps/mobile` points a monorepo at its
 * mobile app, relative to the folder that holds `.reis-mobile/`. A `dir` already inside
 * the app is kept, so running from `apps/mobile/lib` still works.
 *
 * @returns {{ projectDir: string, config: object|null, warnings: string[] }}
 */
export function resolveProjectDir(dir) {
  const requested = resolve(dir);
  const config = findProjectConfig(requested);
  if (!config) return { projectDir: requested, config: null, warnings: [] };

  const warnings = Object.keys(config.data)
    .filter((key) => !KNOWN_KEYS.has(key))
    .map((key) => `${config.path}: unknown key "${key}" ignored`);

  const { app } = config.data;
  if (app === undefined) return { projectDir: requested, config, warnings };
  if (typeof app !== 'string' || !app.trim() || isAbsolute(app)) {
    throw new Error(`${config.path}: "app" must be a folder relative to ${config.root}, such as "apps/mobile"`);
  }

  const appDir = resolve(config.root, app);
  if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
    throw new Error(`${config.path}: app folder "${app}" does not exist`);
  }
  return { projectDir: isInside(requested, appDir) ? requested : appDir, config, warnings };
}

function isInside(child, parent) {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
}
