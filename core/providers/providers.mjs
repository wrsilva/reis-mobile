import { accessSync, constants } from 'node:fs';
import { join } from 'node:path';

import { configPath, readConfig } from '../config/language.mjs';
import { PROVIDERS, PROVIDER_IDS, findProvider, providerEndpoint, unknownProviderMessage } from './catalog.mjs';

export { PROVIDERS, PROVIDER_IDS, findProvider, unknownProviderMessage } from './catalog.mjs';

/**
 * Status of a provider, decided without a single network call so `doctor` and `providers`
 * stay offline:
 *
 * - `ready`     the executable is on PATH, or the credential is set
 * - `local`     keyless local server: selectable, proven only by an actual request
 * - `missing`   no executable and no credential
 * - `disabled`  turned off in the user config
 * - `blocked`   not in the `providers:` allowlist of .reis-mobile/config.yaml
 */
const SELECTABLE = new Set(['ready', 'local']);

/**
 * Finds an executable by scanning PATH instead of shelling out to `which`: one less
 * subprocess, and a platform the tests can inject.
 */
export function findExecutable(command, { env = process.env, platform = process.platform } = {}) {
  const separator = platform === 'win32' ? ';' : ':';
  const extensions = platform === 'win32' ? (env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';') : [''];
  for (const directory of String(env.PATH || '').split(separator).filter(Boolean)) {
    for (const extension of extensions) {
      const candidate = join(directory, `${command}${extension}`);
      try {
        accessSync(candidate, platform === 'win32' ? constants.F_OK : constants.X_OK);
        return candidate;
      } catch {
        // Not here; keep scanning.
      }
    }
  }
  return null;
}

/** The allowlist a team commits in `.reis-mobile/config.yaml`, or null when absent. */
export function providerAllowlist(projectConfig) {
  const value = projectConfig?.data?.providers;
  if (value === undefined) return null;
  const list = (Array.isArray(value) ? value : [value]).map((item) => String(item).trim()).filter(Boolean);
  const unknown = list.filter((id) => !PROVIDER_IDS.includes(id));
  if (unknown.length) {
    return { ids: list.filter((id) => PROVIDER_IDS.includes(id)), warnings: unknown.map((id) => `${projectConfig.path}: ${unknownProviderMessage(id)}`) };
  }
  return { ids: list, warnings: [] };
}

/**
 * Every provider with its status, resolved model and the evidence that decided both.
 * `model` precedence: the `--model` flag, then the provider's model variable, then
 * `providers.<id>.model` in the user config. CLI providers resolve no model: the spelling
 * of their model flag is not verified here, so they keep the one they are configured with.
 */
export async function resolveProviders({
  env = process.env,
  platform = process.platform,
  model: flagModel,
  allow = null,
  config,
  path = configPath({ env }),
} = {}) {
  const settings = config ?? (await readConfig(path));
  const providerSettings = settings.providers ?? {};
  const warnings = [...(allow?.warnings ?? [])];

  const providers = PROVIDERS.map((provider) => {
    const setting = providerSettings[provider.id] ?? {};
    const resolved = {
      id: provider.id,
      label: provider.label,
      kind: provider.kind,
      endpoint: providerEndpoint(provider, env),
      docs: provider.docs,
      needsModel: provider.needsModel === true,
      model: null,
      modelSource: null,
      status: 'missing',
      detail: '',
    };

    if (provider.kind === 'cli') {
      const executable = findExecutable(provider.command, { env, platform });
      resolved.status = executable ? 'ready' : 'missing';
      resolved.detail = executable ?? `${provider.command} not found in PATH`;
      resolved.model = null;
      resolved.modelSource = 'provider';
      if (setting.model || (flagModel && executable)) {
        warnings.push(`${provider.id}: reis-mobile does not set the model of a CLI provider; it uses its own configuration`);
      }
    } else {
      const key = provider.keys.find((candidate) => env[candidate]);
      if (provider.local) {
        resolved.status = 'local';
        resolved.detail = `requires a server at ${resolved.endpoint}`;
      } else {
        resolved.status = key ? 'ready' : 'missing';
        resolved.detail = key ? `${key} set` : `set ${provider.keys.join(' or ')}`;
      }
      const [value, source] = flagModel
        ? [flagModel, '--model']
        : env[provider.modelEnv]
          ? [env[provider.modelEnv], provider.modelEnv]
          : setting.model
            ? [setting.model, `providers.${provider.id}.model`]
            : [null, null];
      resolved.model = value;
      resolved.modelSource = source;
    }

    if (setting.enabled === false) {
      resolved.status = 'disabled';
      resolved.detail = `providers.${provider.id}.enabled is false`;
    } else if (allow && !allow.ids.includes(provider.id)) {
      resolved.status = 'blocked';
      resolved.detail = 'not listed in the project providers allowlist';
    }

    resolved.selectable = SELECTABLE.has(resolved.status);
    // A provider that needs a model and has none is selectable but not runnable: asking for
    // it explicitly reports `no-model`, while the default selection leaves it out.
    resolved.runnable = resolved.selectable && (!resolved.needsModel || Boolean(resolved.model));
    if (resolved.selectable && !resolved.runnable) resolved.detail = `${resolved.detail} · no model configured`;
    return resolved;
  });

  return { providers, warnings, configPath: path };
}

/**
 * The providers a run should talk to. Requested ids that are not usable are kept in the
 * result with their status instead of being dropped: a missing provider is information the
 * caller has to report, not an error to swallow.
 */
export function selectProviders(providers, requested, { requireModel = true } = {}) {
  if (!requested || requested.length === 0) {
    return providers.filter((provider) => (requireModel ? provider.runnable : provider.selectable));
  }
  const unknown = requested.filter((id) => !PROVIDER_IDS.includes(id));
  if (unknown.length) throw new Error(unknownProviderMessage(unknown[0]));
  return requested.map((id) => providers.find((provider) => provider.id === id));
}

/** `--providers codex,openai` */
export function parseProviderList(value) {
  if (value === undefined || value === null) return null;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
