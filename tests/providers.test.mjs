import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmod, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { PROVIDER_IDS } from '../core/providers/catalog.mjs';
import { DEFAULT_TIMEOUT_MS, consult, listProviderModels } from '../core/providers/consult.mjs';
import { findExecutable, providerAllowlist, resolveProviders, selectProviders } from '../core/providers/providers.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';
import { makeProject } from './helpers/fixtures.mjs';

/** A PATH with a single executable in it, so availability never depends on the test machine. */
async function pathWith(name) {
  const dir = await makeProject();
  const file = join(dir, name);
  await writeFile(file, '#!/bin/sh\nexit 0\n');
  await chmod(file, 0o755);
  return dir;
}

const resolve = (options) => resolveProviders({ platform: 'linux', config: {}, ...options });
const byId = (providers, id) => providers.find((provider) => provider.id === id);

describe('provider resolution', () => {
  it('reports every provider with the evidence that decided its status', async () => {
    const { providers } = await resolve({ env: { PATH: '', OPENAI_API_KEY: 'sk-test-key', OPENAI_MODEL: 'model-a' } });

    assert.deepEqual(providers.map((provider) => provider.id), PROVIDER_IDS);
    assert.equal(byId(providers, 'openai').status, 'ready');
    assert.equal(byId(providers, 'openai').detail, 'OPENAI_API_KEY set');
    assert.equal(byId(providers, 'openai').model, 'model-a');
    assert.equal(byId(providers, 'openai').modelSource, 'OPENAI_MODEL');
    assert.equal(byId(providers, 'codex').status, 'missing');
    assert.equal(byId(providers, 'codex').detail, 'codex not found in PATH');
    assert.equal(byId(providers, 'gemini').detail, 'set GEMINI_API_KEY or GOOGLE_API_KEY');
    assert.equal(byId(providers, 'openrouter').endpoint, 'https://openrouter.ai/api/v1');
  });

  it('accepts either credential of a provider that has two', async () => {
    const { providers } = await resolve({ env: { PATH: '', GOOGLE_API_KEY: 'key' } });

    assert.equal(byId(providers, 'gemini').status, 'ready');
    assert.match(byId(providers, 'gemini').detail, /^GOOGLE_API_KEY set/);
  });

  it('finds a CLI provider through PATH without shelling out', async () => {
    const dir = await pathWith('codex');

    const { providers } = await resolve({ env: { PATH: dir } });

    assert.equal(byId(providers, 'codex').status, 'ready');
    assert.equal(byId(providers, 'codex').detail, join(dir, 'codex'));
    assert.equal(findExecutable('codex', { env: { PATH: dir }, platform: 'linux' }), join(dir, 'codex'));
    assert.equal(findExecutable('absent-tool', { env: { PATH: dir }, platform: 'linux' }), null);
  });

  it('keeps a CLI provider on its own model and warns when one is configured', async () => {
    const dir = await pathWith('gemini');

    const { providers, warnings } = await resolve({
      env: { PATH: dir },
      config: { providers: { 'gemini-cli': { model: 'ignored' } } },
    });

    assert.equal(byId(providers, 'gemini-cli').model, null);
    assert.equal(byId(providers, 'gemini-cli').runnable, true, 'a CLI provider needs no model from reis-mobile');
    assert.match(warnings.join('\n'), /gemini-cli: reis-mobile does not set the model of a CLI provider/);
  });

  it('prefers --model, then the environment, then the config file', async () => {
    const env = { PATH: '', OPENAI_API_KEY: 'k', OPENAI_MODEL: 'from-env' };
    const config = { providers: { openai: { model: 'from-config' } } };

    assert.equal(byId((await resolve({ env, config, model: 'from-flag' })).providers, 'openai').modelSource, '--model');
    assert.equal(byId((await resolve({ env, config })).providers, 'openai').modelSource, 'OPENAI_MODEL');
    const fromConfig = byId((await resolve({ env: { PATH: '', OPENAI_API_KEY: 'k' }, config })).providers, 'openai');
    assert.equal(fromConfig.model, 'from-config');
    assert.equal(fromConfig.modelSource, 'providers.openai.model');
  });

  it('reports Ollama as local and selectable only once a model is configured', async () => {
    const { providers } = await resolve({ env: { PATH: '', OLLAMA_HOST: 'box:11434' } });
    const ollama = byId(providers, 'ollama');

    assert.equal(ollama.status, 'local');
    assert.equal(ollama.endpoint, 'http://box:11434');
    assert.equal(ollama.selectable, true);
    assert.equal(ollama.runnable, false, 'without a model it is not runnable');
    assert.match(ollama.detail, /no model configured/);

    const configured = await resolve({ env: { PATH: '', OLLAMA_HOST: 'box:11434', OLLAMA_MODEL: 'local-model' } });
    assert.equal(byId(configured.providers, 'ollama').runnable, true);
  });

  it('honors enabled: false in the user config', async () => {
    const { providers } = await resolve({
      env: { PATH: '', OPENAI_API_KEY: 'k', OPENAI_MODEL: 'm' },
      config: { providers: { openai: { enabled: false } } },
    });

    assert.equal(byId(providers, 'openai').status, 'disabled');
    assert.equal(byId(providers, 'openai').selectable, false);
  });

  it('blocks providers outside the project allowlist', async () => {
    const allow = providerAllowlist({ path: '/repo/.reis-mobile/config.yaml', data: { providers: ['ollama'] } });

    const { providers } = await resolve({ env: { PATH: '', OPENAI_API_KEY: 'k', OPENAI_MODEL: 'm' }, allow });

    assert.equal(byId(providers, 'openai').status, 'blocked');
    assert.equal(byId(providers, 'openai').detail, 'not listed in the project providers allowlist');
    assert.equal(byId(providers, 'ollama').status, 'local');
  });

  it('treats an absent allowlist as no restriction and an empty one as none allowed', async () => {
    assert.equal(providerAllowlist({ data: {} }), null);
    assert.equal(providerAllowlist(null), null);
    assert.deepEqual(providerAllowlist({ data: { providers: [] } }), { ids: [], warnings: [] });

    const { providers } = await resolve({
      env: { PATH: '', OPENAI_API_KEY: 'k', OPENAI_MODEL: 'm' },
      allow: providerAllowlist({ data: { providers: [] } }),
    });
    assert.equal(byId(providers, 'openai').status, 'blocked');
  });

  it('warns about an unknown id in the allowlist instead of failing the run', async () => {
    const allow = providerAllowlist({ path: '/repo/.reis-mobile/config.yaml', data: { providers: ['openai', 'not-a-provider'] } });

    assert.deepEqual(allow.ids, ['openai']);
    const { warnings } = await resolve({ env: { PATH: '', OPENAI_API_KEY: 'k', OPENAI_MODEL: 'm' }, allow });
    assert.match(warnings.join('\n'), /Unknown provider "not-a-provider"/);
  });

  it('selects runnable providers by default and keeps explicit ones with their status', async () => {
    const { providers } = await resolve({ env: { PATH: '', OPENAI_API_KEY: 'k', OPENAI_MODEL: 'm' } });

    assert.deepEqual(selectProviders(providers, null).map((provider) => provider.id), ['openai']);
    assert.deepEqual(selectProviders(providers, ['codex', 'openai']).map((provider) => provider.status), ['missing', 'ready']);
    assert.deepEqual(
      selectProviders(providers, null, { requireModel: false }).map((provider) => provider.id),
      ['openai', 'ollama'],
      'listing models does not require a model',
    );
    assert.throws(() => selectProviders(providers, ['nope']), /Unknown provider "nope"/);
  });
});

describe('consult', () => {
  const ready = async (env = { PATH: '', OPENAI_API_KEY: 'sk-live-secret-value-1234567890', OPENAI_MODEL: 'model-a' }) => {
    const { providers } = await resolve({ env });
    return { env, providers };
  };

  const jsonResponse = (payload) => ({ ok: true, status: 200, json: async () => payload });
  const completion = (text) => jsonResponse({ choices: [{ message: { content: text } }] });

  it('sends a redacted prompt and returns a redacted answer', async () => {
    const { env, providers } = await ready();
    const sent = [];
    const fetchImpl = async (url, init) => {
      sent.push({ url, init });
      return completion('leaked OPENAI_API_KEY=sk-live-secret-value-1234567890 back');
    };

    const result = await consult({
      prompt: 'review this: OPENAI_API_KEY=sk-live-secret-value-1234567890',
      providers: selectProviders(providers, ['openai']),
      env,
      fetchImpl,
    });

    assert.equal(sent[0].url, 'https://api.openai.com/v1/chat/completions');
    assert.equal(sent[0].init.headers.authorization, 'Bearer sk-live-secret-value-1234567890');
    assert.doesNotMatch(sent[0].init.body, /sk-live-secret-value/, 'the prompt is masked before it leaves');
    assert.equal(JSON.parse(sent[0].init.body).model, 'model-a');
    assert.equal(result.prompt.redacted, true);
    assert.equal(result.results[0].status, 'ok');
    assert.doesNotMatch(result.results[0].text, /sk-live-secret-value/, 'an echoed secret is masked on the way back');
    assert.equal(result.timeoutMs, DEFAULT_TIMEOUT_MS);
  });

  it('builds a Gemini request from the catalog and reads its answer', async () => {
    const env = { PATH: '', GEMINI_API_KEY: 'key', GEMINI_MODEL: 'some-model' };
    const { providers } = await resolve({ env });
    const sent = [];
    const fetchImpl = async (url, init) => {
      sent.push({ url, init });
      return jsonResponse({ candidates: [{ content: { parts: [{ text: 'part one ' }, { text: 'part two' }] } }] });
    };

    const result = await consult({ prompt: 'question', providers: selectProviders(providers, ['gemini']), env, fetchImpl });

    assert.equal(sent[0].url, 'https://generativelanguage.googleapis.com/v1beta/models/some-model:generateContent');
    assert.equal(sent[0].init.headers['x-goog-api-key'], 'key');
    assert.deepEqual(JSON.parse(sent[0].init.body).contents, [{ role: 'user', parts: [{ text: 'question' }] }]);
    assert.equal(result.results[0].text, 'part one part two');
  });

  it('asks every selected provider in parallel', async () => {
    const env = { PATH: '', OPENAI_API_KEY: 'a', OPENAI_MODEL: 'm', OPENROUTER_API_KEY: 'b', OPENROUTER_MODEL: 'm' };
    const { providers } = await resolve({ env });
    let inFlight = 0;
    let peak = 0;
    const fetchImpl = async () => {
      peak = Math.max(peak, ++inFlight);
      await new Promise((done) => setTimeout(done, 10));
      inFlight--;
      return completion('answer');
    };

    const result = await consult({ prompt: 'q', providers: selectProviders(providers, null), env, fetchImpl });

    assert.equal(peak, 2);
    assert.deepEqual(result.results.map((item) => item.provider), ['openai', 'openrouter']);
    assert.ok(result.results.every((item) => item.status === 'ok'));
  });

  it('reports an unusable provider instead of dropping it', async () => {
    const { env, providers } = await ready();

    const result = await consult({
      prompt: 'q',
      providers: selectProviders(providers, ['codex', 'ollama']),
      env,
      fetchImpl: async () => completion('never called'),
    });

    assert.equal(result.results[0].status, 'unavailable');
    assert.equal(result.results[0].error, 'codex not found in PATH');
    assert.equal(result.results[1].status, 'no-model');
    assert.match(result.results[1].error, /Set OLLAMA_MODEL/);
    assert.match(result.results[1].error, /providers --models/);
  });

  it('reports an HTTP failure with its status and no credential', async () => {
    const { env, providers } = await ready();
    const fetchImpl = async () => ({ ok: false, status: 429, text: async () => 'slow down\nnow' });

    const result = await consult({ prompt: 'q', providers: selectProviders(providers, ['openai']), env, fetchImpl });

    assert.equal(result.results[0].status, 'error');
    assert.equal(result.results[0].error, 'HTTP 429: slow down now');
    assert.doesNotMatch(result.results[0].error, /sk-live/);
  });

  it('reports a timeout as a timeout', async () => {
    const { env, providers } = await ready();
    const fetchImpl = (url, init) =>
      new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      });

    const result = await consult({ prompt: 'q', providers: selectProviders(providers, ['openai']), env, fetchImpl, timeoutMs: 20 });

    assert.equal(result.results[0].status, 'timeout');
    assert.equal(result.results[0].error, 'no answer in 20 ms');
  });

  it('reports an unparseable or empty answer as an error', async () => {
    const { env, providers } = await ready();
    const selected = selectProviders(providers, ['openai']);

    const broken = await consult({ prompt: 'q', providers: selected, env, fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new Error('not json'); } }) });
    assert.equal(broken.results[0].error, 'the answer was not JSON');

    const empty = await consult({ prompt: 'q', providers: selected, env, fetchImpl: async () => completion('   ') });
    assert.equal(empty.results[0].error, 'the provider returned no text');
  });

  it('refuses an empty question', async () => {
    const { env, providers } = await ready();

    await assert.rejects(() => consult({ prompt: '  ', providers, env }), /consult needs a prompt/);
  });

  it('runs a CLI provider read-only, in a throwaway directory', async () => {
    const dir = await pathWith('codex');
    const env = { PATH: dir };
    const { providers } = await resolve({ env });
    const calls = [];
    const runCommand = async (call) => {
      calls.push(call);
      return { status: 'ok', stdout: 'cli answer\n' };
    };

    const result = await consult({ prompt: 'briefing', providers: selectProviders(providers, ['codex']), env, runCommand });

    assert.deepEqual(calls[0].args, ['exec', '--sandbox', 'read-only', '--skip-git-repo-check', 'briefing']);
    assert.equal(calls[0].stdin, undefined, 'codex receives the prompt as an argument');
    assert.notEqual(calls[0].cwd, process.cwd());
    assert.match(calls[0].cwd, /reis-mobile-consult-/);
    assert.equal(existsAfterRun(calls[0].cwd), false, 'the working directory is removed');
    assert.equal(result.results[0].text, 'cli answer');
    assert.equal(result.results[0].status, 'ok');
  });

  it('reports the stderr line that explains a CLI failure, not the opening banner', async () => {
    const dir = await pathWith('codex');
    const env = { PATH: dir };
    const { providers } = await resolve({ env });
    const { spawnCommand } = await import('../core/providers/consult.mjs');

    const banner = await spawnCommand({
      command: process.execPath,
      args: ['-e', "console.error('Starting up, reading configuration'); console.error('Error authenticating: token expired'); process.exit(1)"],
      cwd: process.cwd(),
      timeoutMs: 10_000,
      env: process.env,
    });

    assert.equal(banner.status, 'error');
    assert.equal(banner.error, 'Error authenticating: token expired');
    assert.ok(providers.length > 0);
  });

  it('passes the briefing to the Gemini CLI on stdin', async () => {
    const dir = await pathWith('gemini');
    const env = { PATH: dir };
    const { providers } = await resolve({ env });
    const calls = [];
    const runCommand = async (call) => {
      calls.push(call);
      return { status: 'error', error: 'gemini: quota exhausted' };
    };

    const result = await consult({ prompt: 'briefing', providers: selectProviders(providers, ['gemini-cli']), env, runCommand });

    assert.deepEqual(calls[0].args, ['-p', '', '-o', 'text', '--approval-mode', 'plan']);
    assert.equal(calls[0].stdin, 'briefing');
    assert.equal(result.results[0].status, 'error');
    assert.equal(result.results[0].error, 'gemini: quota exhausted');
  });
});

function existsAfterRun(path) {
  return spawnSync('test', ['-d', path]).status === 0;
}

describe('provider model catalogs', () => {
  it('asks each HTTP provider what it serves and never invents an id', async () => {
    const env = { PATH: '', OPENAI_API_KEY: 'k', OLLAMA_MODEL: 'm' };
    const { providers } = await resolve({ env });
    const urls = [];
    const fetchImpl = async (url) => {
      urls.push(url);
      return url.endsWith('/api/tags')
        ? { ok: true, status: 200, json: async () => ({ models: [{ name: 'local:latest' }] }) }
        : { ok: true, status: 200, json: async () => ({ data: [{ id: 'remote-1' }, { id: 'remote-2' }] }) };
    };

    const catalogs = await listProviderModels({ providers: selectProviders(providers, ['openai', 'ollama']), env, fetchImpl });

    assert.deepEqual(urls, ['https://api.openai.com/v1/models', 'http://127.0.0.1:11434/api/tags']);
    assert.deepEqual(catalogs[0].models, ['remote-1', 'remote-2']);
    assert.deepEqual(catalogs[1].models, ['local:latest']);
  });

  it('strips the models/ prefix Gemini returns', async () => {
    const env = { PATH: '', GEMINI_API_KEY: 'k' };
    const { providers } = await resolve({ env });
    const fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ models: [{ name: 'models/some-model' }] }) });

    const [catalog] = await listProviderModels({ providers: selectProviders(providers, ['gemini']), env, fetchImpl });

    assert.deepEqual(catalog.models, ['some-model']);
  });

  it('reports a CLI provider as unsupported and an unreachable one with its reason', async () => {
    const { providers } = await resolve({ env: { PATH: '' } });

    const catalogs = await listProviderModels({
      providers: selectProviders(providers, ['codex', 'openai']),
      env: { PATH: '' },
      fetchImpl: async () => {
        throw new Error('fetch must not run');
      },
    });

    assert.equal(catalogs[0].status, 'unsupported');
    assert.match(catalogs[0].error, /uses the model it is configured with/);
    assert.equal(catalogs[1].status, 'unavailable');
    assert.equal(catalogs[1].error, 'set OPENAI_API_KEY');
  });
});

describe('providers and consult in the CLI', () => {
  const cli = (env, ...args) =>
    spawnSync(process.execPath, [join(PLUGIN_ROOT, 'bin/reis-mobile.mjs'), ...args], {
      encoding: 'utf8',
      input: '',
      env: { ...process.env, PATH: '', REIS_MOBILE_CONFIG: join(PLUGIN_ROOT, 'tests', 'fixtures', 'missing.json'), ...env },
    });

  it('lists every provider and what it needs', async () => {
    const result = cli({ OPENAI_API_KEY: 'k', OPENAI_MODEL: 'm' }, 'providers', '--all', '--json');
    const output = JSON.parse(result.stdout);

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(output.providers.map((provider) => provider.id), PROVIDER_IDS);
    assert.equal(output.providers.find((provider) => provider.id === 'openai').status, 'ready');
  });

  it('hides unusable providers unless --all is given', () => {
    const configured = cli({ OPENAI_API_KEY: 'k', OPENAI_MODEL: 'm' }, 'providers');

    assert.equal(configured.status, 0, configured.stderr);
    assert.match(configured.stdout, /openai\s+✓ ready/);
    assert.doesNotMatch(configured.stdout, /openrouter/);
    assert.match(configured.stdout, /1 provider\(s\) ready/);
  });

  it('honors the project allowlist', async () => {
    const dir = await makeProject({ '.reis-mobile/config.yaml': 'providers:\n  - ollama\n' });

    const result = cli({ OPENAI_API_KEY: 'k', OPENAI_MODEL: 'm' }, 'providers', '--all', '--json', '--dir', dir);
    const output = JSON.parse(result.stdout);

    assert.equal(output.providers.find((provider) => provider.id === 'openai').status, 'blocked');
    assert.equal(output.projectConfig, join(dir, '.reis-mobile/config.yaml'));
  });

  it('refuses to consult without a question or without a ready provider', () => {
    const noQuestion = cli({ OPENAI_API_KEY: 'k', OPENAI_MODEL: 'm' }, 'consult');
    assert.equal(noQuestion.status, 1);
    assert.match(noQuestion.stderr, /consult needs a question/);

    const noProvider = cli({}, 'consult', '--', 'why is this slow?');
    assert.equal(noProvider.status, 1);
    assert.match(noProvider.stderr, /No external provider is ready/);

    const unknown = cli({}, 'consult', '--providers', 'nope', '--', 'q');
    assert.equal(unknown.status, 1);
    assert.match(unknown.stderr, /Unknown provider "nope"/);
  });

  it('rejects a timeout that is not a positive number', () => {
    const result = cli({ OPENAI_API_KEY: 'k', OPENAI_MODEL: 'm' }, 'consult', '--timeout', 'soon', '--', 'q');

    assert.equal(result.status, 1);
    assert.match(result.stderr, /--timeout must be a positive number/);
  });
});
