// External model providers reis-mobile can ask for a second opinion.
//
// A provider is data, not code paths spread across commands: the catalog says how to reach
// it, which credential proves it is usable and where its model catalog lives. Nothing here
// carries a default model id — a provider is the only authority on its own catalog, and a
// hardcoded id becomes wrong the day it is retired. `providers --models` asks instead.

const JSON_HEADERS = { 'content-type': 'application/json' };

/** OpenAI, OpenRouter and any other `/chat/completions` endpoint share this shape. */
function openAiCompatible({ id, label, docs, keys, modelEnv, baseEnv, defaultBase, headers = {} }) {
  const base = (env) => trimTrailingSlash(env[baseEnv] || defaultBase);
  const auth = (env) => ({ authorization: `Bearer ${credential(env, keys)}`, ...headers });
  return {
    id,
    label,
    kind: 'http',
    docs,
    keys,
    modelEnv,
    needsModel: true,
    base,
    chat: ({ prompt, model, env }) => ({
      url: `${base(env)}/chat/completions`,
      init: {
        method: 'POST',
        headers: { ...JSON_HEADERS, ...auth(env) },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
      },
    }),
    readChat: (body) => body?.choices?.[0]?.message?.content ?? '',
    catalog: ({ env }) => ({ url: `${base(env)}/models`, init: { headers: auth(env) } }),
    readCatalog: (body) => (body?.data ?? []).map((item) => item?.id).filter(Boolean),
  };
}

export const PROVIDERS = [
  {
    id: 'codex',
    label: 'Codex CLI',
    kind: 'cli',
    docs: 'https://developers.openai.com/codex/cli',
    command: 'codex',
    // `--sandbox read-only` because a second opinion never needs to write, and
    // `--skip-git-repo-check` because the call runs in a temporary directory, not a repository.
    // Verified against `codex exec --help` (codex-cli 0.155.1); the prompt is an argument.
    argv: ({ prompt }) => ['exec', '--sandbox', 'read-only', '--skip-git-repo-check', prompt],
    stdin: () => undefined,
    version: ['--version'],
  },
  {
    id: 'gemini-cli',
    label: 'Gemini CLI',
    kind: 'cli',
    docs: 'https://github.com/google-gemini/gemini-cli',
    command: 'gemini',
    // `-p ""` plus the briefing on stdin, as `--prompt` is appended to stdin input, and
    // `--approval-mode plan`, the read-only mode (`gemini --help`, gemini-cli 0.34.0).
    argv: () => ['-p', '', '-o', 'text', '--approval-mode', 'plan'],
    stdin: ({ prompt }) => prompt,
    version: ['--version'],
  },
  openAiCompatible({
    id: 'openai',
    label: 'OpenAI',
    docs: 'https://platform.openai.com/docs/api-reference',
    keys: ['OPENAI_API_KEY'],
    modelEnv: 'OPENAI_MODEL',
    baseEnv: 'OPENAI_BASE_URL',
    defaultBase: 'https://api.openai.com/v1',
  }),
  openAiCompatible({
    id: 'openrouter',
    label: 'OpenRouter',
    docs: 'https://openrouter.ai/docs',
    keys: ['OPENROUTER_API_KEY'],
    modelEnv: 'OPENROUTER_MODEL',
    baseEnv: 'OPENROUTER_BASE_URL',
    defaultBase: 'https://openrouter.ai/api/v1',
    headers: { 'x-title': 'reis-mobile' },
  }),
  {
    id: 'gemini',
    label: 'Gemini API',
    kind: 'http',
    docs: 'https://ai.google.dev/gemini-api/docs',
    keys: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    modelEnv: 'GEMINI_MODEL',
    needsModel: true,
    base: geminiBase,
    chat: ({ prompt, model, env }) => ({
      url: `${geminiBase(env)}/models/${encodeURIComponent(model)}:generateContent`,
      init: {
        method: 'POST',
        headers: { ...JSON_HEADERS, 'x-goog-api-key': credential(env, ['GEMINI_API_KEY', 'GOOGLE_API_KEY']) },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
      },
    }),
    readChat: (body) =>
      (body?.candidates?.[0]?.content?.parts ?? [])
        .map((part) => part?.text)
        .filter(Boolean)
        .join(''),
    catalog: ({ env }) => ({
      url: `${geminiBase(env)}/models`,
      init: { headers: { 'x-goog-api-key': credential(env, ['GEMINI_API_KEY', 'GOOGLE_API_KEY']) } },
    }),
    readCatalog: (body) => (body?.models ?? []).map((item) => String(item?.name ?? '').replace(/^models\//, '')).filter(Boolean),
  },
  {
    id: 'ollama',
    label: 'Ollama',
    kind: 'http',
    docs: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
    // No credential: a local server is either running or it is not, and only a request tells.
    keys: [],
    local: true,
    modelEnv: 'OLLAMA_MODEL',
    needsModel: true,
    base: ollamaBase,
    chat: ({ prompt, model, env }) => ({
      url: `${ollamaBase(env)}/api/chat`,
      init: {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], stream: false }),
      },
    }),
    readChat: (body) => body?.message?.content ?? '',
    catalog: ({ env }) => ({ url: `${ollamaBase(env)}/api/tags`, init: {} }),
    readCatalog: (body) => (body?.models ?? []).map((item) => item?.name).filter(Boolean),
  },
];

export const PROVIDER_IDS = PROVIDERS.map((provider) => provider.id);

export function findProvider(id) {
  return PROVIDERS.find((provider) => provider.id === id) ?? null;
}

export function unknownProviderMessage(id) {
  return `Unknown provider "${id}". Use one of: ${PROVIDER_IDS.join(', ')}`;
}

/** The endpoint a provider is reached at, so `providers` can show where a call would go. */
export function providerEndpoint(provider, env = process.env) {
  return provider.kind === 'cli' ? provider.command : provider.base(env);
}

function geminiBase(env) {
  return trimTrailingSlash(env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta');
}

/** `OLLAMA_HOST` is commonly set without a scheme (`127.0.0.1:11434`). */
function ollamaBase(env) {
  const host = (env.OLLAMA_HOST || '').trim();
  if (!host) return 'http://127.0.0.1:11434';
  return trimTrailingSlash(/^https?:\/\//.test(host) ? host : `http://${host}`);
}

function credential(env, keys) {
  for (const key of keys) if (env[key]) return env[key];
  return '';
}

function trimTrailingSlash(value) {
  return String(value).replace(/\/+$/, '');
}
