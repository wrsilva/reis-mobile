import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { redactSecrets } from '../security/redact.mjs';
import { findProvider } from './catalog.mjs';

export const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_BYTES = 2_000_000;
const ERROR_BODY_CHARS = 300;

/**
 * Asks each provider the same question, in parallel, and returns one result per requested
 * provider.
 *
 * The core makes the call instead of handing the model a command to run: a credential must
 * never reach a transcript or a tool log. The prompt is redacted on the way out — a
 * third-party provider is exactly the boundary `redactSecrets` exists for — and every answer
 * is redacted on the way in, because a provider can echo back what it was given.
 *
 * Statuses: `ok`, `unavailable` (the provider cannot be reached at all), `no-model`,
 * `timeout`, `error`.
 */
export async function consult({
  prompt,
  providers,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  env = process.env,
  fetchImpl = globalThis.fetch,
  runCommand = spawnCommand,
} = {}) {
  const text = redactSecrets(String(prompt ?? ''));
  if (!text.trim()) throw new Error('consult needs a prompt. Pass it as an argument, with --file, or on stdin.');

  const results = await Promise.all(
    providers.map((resolved) => askOne({ resolved, prompt: text, timeoutMs, env, fetchImpl, runCommand })),
  );
  return {
    prompt: { chars: text.length, redacted: text !== String(prompt ?? '') },
    timeoutMs,
    results,
  };
}

async function askOne({ resolved, prompt, timeoutMs, env, fetchImpl, runCommand }) {
  const base = {
    provider: resolved.id,
    label: resolved.label,
    kind: resolved.kind,
    model: resolved.model,
    status: 'error',
    text: '',
    error: null,
    durationMs: 0,
  };
  if (!resolved.selectable) return { ...base, status: 'unavailable', error: resolved.detail };
  if (resolved.needsModel && !resolved.model) {
    const provider = findProvider(resolved.id);
    return {
      ...base,
      status: 'no-model',
      error: `no model configured. Set ${provider.modelEnv}, or providers.${resolved.id}.model in the config file, or pass --model. Run \`reis-mobile providers --models --providers ${resolved.id}\` to see what it serves.`,
    };
  }

  const started = Date.now();
  const outcome = await (resolved.kind === 'cli'
    ? askCli({ resolved, prompt, timeoutMs, env, runCommand })
    : askHttp({ resolved, prompt, timeoutMs, env, fetchImpl }));
  return { ...base, ...outcome, durationMs: Date.now() - started };
}

async function askHttp({ resolved, prompt, timeoutMs, env, fetchImpl }) {
  const provider = findProvider(resolved.id);
  const { url, init } = provider.chat({ prompt, model: resolved.model, env });
  const response = await withTimeout(timeoutMs, (signal) => fetchImpl(url, { ...init, signal }));
  if (response.timedOut) return { status: 'timeout', error: `no answer in ${timeoutMs} ms` };
  if (response.failed) return { status: 'error', error: safe(response.error) };

  if (!response.value.ok) {
    const body = await readBody(response.value);
    return { status: 'error', error: safe(`HTTP ${response.value.status}${body ? `: ${body.slice(0, ERROR_BODY_CHARS)}` : ''}`) };
  }
  let payload;
  try {
    payload = await response.value.json();
  } catch {
    return { status: 'error', error: 'the answer was not JSON' };
  }
  const text = safe(provider.readChat(payload));
  return text.trim() ? { status: 'ok', text } : { status: 'error', error: 'the provider returned no text' };
}

/**
 * CLI providers run in a throwaway directory. `codex exec --full-auto` and `gemini
 * --approval-mode yolo` may write files, and the briefing already carries every file they
 * need to read, so there is no reason to give them the user's repository as a workspace.
 */
async function askCli({ resolved, prompt, timeoutMs, env, runCommand }) {
  const provider = findProvider(resolved.id);
  const workdir = await mkdtemp(join(tmpdir(), 'reis-mobile-consult-'));
  try {
    const result = await runCommand({
      command: provider.command,
      args: provider.argv({ prompt }),
      stdin: provider.stdin({ prompt }),
      cwd: workdir,
      timeoutMs,
      env,
    });
    if (result.status === 'timeout') return { status: 'timeout', error: `no answer in ${timeoutMs} ms` };
    if (result.status === 'error') return { status: 'error', error: safe(result.error) };
    const text = safe(result.stdout).trim();
    return text ? { status: 'ok', text } : { status: 'error', error: 'the provider returned no text' };
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

/** What each selected provider says it serves, so reis-mobile never invents a model id. */
export async function listProviderModels({ providers, env = process.env, fetchImpl = globalThis.fetch, timeoutMs = 30_000 } = {}) {
  return Promise.all(
    providers.map(async (resolved) => {
      const base = { provider: resolved.id, label: resolved.label, kind: resolved.kind, models: [], status: 'error', error: null };
      if (resolved.kind === 'cli') return { ...base, status: 'unsupported', error: 'a CLI provider uses the model it is configured with' };
      if (!resolved.selectable) return { ...base, status: 'unavailable', error: resolved.detail };

      const provider = findProvider(resolved.id);
      const { url, init } = provider.catalog({ env });
      const response = await withTimeout(timeoutMs, (signal) => fetchImpl(url, { ...init, signal }));
      if (response.timedOut) return { ...base, status: 'timeout', error: `no answer in ${timeoutMs} ms` };
      if (response.failed) return { ...base, status: 'error', error: safe(response.error) };
      if (!response.value.ok) return { ...base, status: 'error', error: safe(`HTTP ${response.value.status}`) };
      try {
        return { ...base, status: 'ok', models: provider.readCatalog(await response.value.json()) };
      } catch {
        return { ...base, status: 'error', error: 'the answer was not JSON' };
      }
    }),
  );
}

async function withTimeout(timeoutMs, call) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return { value: await call(controller.signal) };
  } catch (error) {
    return controller.signal.aborted ? { timedOut: true } : { failed: true, error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function readBody(response) {
  try {
    return (await response.text()).trim().replace(/\s+/g, ' ');
  } catch {
    return '';
  }
}

/** Collects stdout instead of using execFile, which cannot write to stdin. */
export function spawnCommand({ command, args, stdin, cwd, timeoutMs, env }) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (error) {
      resolve({ status: 'error', error: error.message });
      return;
    }
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      if (stdout.length < MAX_OUTPUT_BYTES) stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      if (stderr.length < MAX_OUTPUT_BYTES) stderr += chunk;
    });
    child.stdin.on('error', () => {
      // The provider closed stdin before reading the prompt; the exit code reports it.
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ status: 'error', error: error.code === 'ENOENT' ? `${command} not found in PATH` : error.message });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) resolve({ status: 'timeout' });
      else if (code === 0) resolve({ status: 'ok', stdout });
      else resolve({ status: 'error', error: failureLine(stderr) || `${command} exited with code ${code}` });
    });
    child.stdin.end(stdin ?? '');
  });
}

/** Nothing leaves this module without passing the redaction layer. */
function safe(value) {
  return redactSecrets(String(value ?? ''));
}

/**
 * The line of stderr that explains the failure. Agentic CLIs open with banners and notices,
 * so the first line is usually noise and the cause is further down.
 */
function failureLine(text) {
  const lines = String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.find((line) => /\b(error|failed|failure|unauthorized|forbidden|quota|unexpected|not found|invalid|denied)\b/i.test(line)) ?? lines.at(-1) ?? '';
}
