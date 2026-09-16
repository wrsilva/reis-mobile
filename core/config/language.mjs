import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * Language the /mobile:* commands answer in. Agents, skills and commands stay in
 * English; this only picks the language of reports, syntheses and debate files.
 */
export const LANGUAGES = {
  en: 'English',
  pt: 'Portuguese (Brazil)',
};

const ALIASES = {
  en: 'en',
  eng: 'en',
  english: 'en',
  'en-us': 'en',
  pt: 'pt',
  'pt-br': 'pt',
  ptbr: 'pt',
  portuguese: 'pt',
  portugues: 'pt',
};

/** Returns `en`, `pt` or null for an unknown value. */
export function normalizeLanguage(value) {
  if (typeof value !== 'string') return null;
  return ALIASES[value.trim().toLowerCase().replace('_', '-')] ?? null;
}

export function configPath({ env = process.env, platform = process.platform, home = homedir() } = {}) {
  if (env.REIS_MOBILE_CONFIG) return env.REIS_MOBILE_CONFIG;
  if (platform === 'win32' && env.APPDATA) return join(env.APPDATA, 'reis-mobile', 'config.json');
  return join(env.XDG_CONFIG_HOME || join(home, '.config'), 'reis-mobile', 'config.json');
}

export async function readConfig(path = configPath()) {
  let source;
  try {
    source = await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
  try {
    return JSON.parse(source);
  } catch {
    throw new Error(`Invalid JSON in ${path}. Fix or delete the file and run \`mobile lang <en|pt>\` again.`);
  }
}

export async function saveLanguage(language, path = configPath()) {
  const normalized = normalizeLanguage(language);
  if (!normalized) throw new Error(unknownLanguageMessage(language));
  const config = { ...(await readConfig(path)), language: normalized };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
  return normalized;
}

export async function removeConfig(path = configPath()) {
  await rm(path, { force: true });
}

/**
 * Precedence: explicit flag, then REIS_MOBILE_LANG, then the config file.
 * Returns null when nothing is set, meaning "answer in the user's language".
 */
export async function resolveLanguage({ flag, env = process.env, path = configPath({ env }) } = {}) {
  for (const [value, origin] of [[flag, '--lang'], [env.REIS_MOBILE_LANG, 'REIS_MOBILE_LANG']]) {
    if (value === undefined || value === '') continue;
    const language = normalizeLanguage(value);
    if (!language) throw new Error(`${origin}: ${unknownLanguageMessage(value)}`);
    return language;
  }
  const { language } = await readConfig(path);
  return normalizeLanguage(language);
}

export function unknownLanguageMessage(value) {
  return `Unknown language "${value}". Use one of: ${Object.keys(LANGUAGES).join(', ')}`;
}
