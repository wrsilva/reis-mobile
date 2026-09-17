import { readFile, mkdir, rm, rmdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import { PLUGIN_ROOT } from '../paths.mjs';

const REGISTRY_URL = 'https://registry.npmjs.org/reis-mobile/latest';
const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 60 * 1000;

export function updateCachePath(env = process.env) {
  const base = process.platform === 'win32'
    ? env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local')
    : env.XDG_CACHE_HOME || join(homedir(), '.cache');
  return join(base, 'reis-mobile', 'update-check.json');
}

export async function clearUpdateCache(path = updateCachePath()) {
  try {
    await rm(path, { force: true });
    await rmdir(dirname(path));
  } catch {
    // Cache cleanup must not prevent uninstalling the plugin.
  }
}

export async function installedVersion(root = PLUGIN_ROOT) {
  return JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version;
}

export function compareVersions(left, right) {
  const parse = (value) => {
    if (typeof value !== 'string') return null;
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(value);
    if (!match) return null;
    const numbers = match.slice(1, 4).map(Number);
    return numbers.every(Number.isSafeInteger) ? { numbers, prerelease: match[4] } : null;
  };
  const a = parse(left);
  const b = parse(right);
  if (!a || !b) return null;
  for (let index = 0; index < 3; index++) {
    if (a.numbers[index] !== b.numbers[index]) return Math.sign(a.numbers[index] - b.numbers[index]);
  }
  if (a.prerelease === b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  // The package is published under the stable npm dist-tag. An unknown prerelease
  // ordering should never generate an update warning for the same base version.
  return null;
}

export async function fetchLatestVersion(fetcher = fetch) {
  const response = await fetcher(REGISTRY_URL, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(1500),
  });
  if (!response.ok) throw new Error(`Registry returned ${response.status}`);
  const { version } = await response.json();
  if (typeof version !== 'string' || compareVersions(version, version) === null) {
    throw new Error('Registry returned an invalid version');
  }
  return version;
}

export async function checkForUpdate({
  current,
  cachePath = updateCachePath(),
  now = Date.now(),
  force = false,
  fetchVersion = fetchLatestVersion,
} = {}) {
  const version = current ?? await installedVersion();
  let cached;
  try {
    cached = JSON.parse(await readFile(cachePath, 'utf8'));
  } catch {
    cached = null;
  }
  const cachedLatest = compareVersions(cached?.latest, cached?.latest) === 0 ? cached.latest : null;
  const age = now - cached?.checkedAt;
  const ttl = cachedLatest ? SUCCESS_TTL_MS : FAILURE_TTL_MS;
  let latest = cachedLatest;
  if (force || !Number.isFinite(age) || age < 0 || age >= ttl) {
    try {
      latest = await fetchVersion();
      if (compareVersions(latest, latest) === null) throw new Error('Invalid version');
    } catch {
      latest = cachedLatest;
      if (!latest) {
        await saveCache(cachePath, { checkedAt: now, latest: null });
        return { status: 'unavailable', current: version };
      }
    }
    await saveCache(cachePath, { checkedAt: now, latest });
  }
  if (!latest || compareVersions(version, latest) === null) return { status: 'unavailable', current: version };
  return {
    status: compareVersions(version, latest) < 0 ? 'outdated' : 'current',
    current: version,
    latest,
  };
}

async function saveCache(path, value) {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(value), { mode: 0o600 });
  } catch {
    // A read-only home must not interrupt a session.
  }
}

export function updateMessage({ current, latest }, tool = 'claude') {
  const update = tool === 'codex'
    ? 'codex plugin marketplace upgrade reis-mobile && codex plugin add reis-mobile@reis-mobile'
    : 'claude plugin marketplace update reis-mobile && claude plugin update reis-mobile@reis-mobile';
  return `reis-mobile ${current} is outdated; ${latest} is available. Update the plugin: ${update}. If you installed the CLI with npm, also run npm update -g reis-mobile.`;
}
