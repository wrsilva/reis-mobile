import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { constants, tmpdir } from 'node:os';
import { join } from 'node:path';

import { Compactor, cleanLine, truncate } from './compact.mjs';
import { createReadiness } from './readiness.mjs';
import { duration, statusLine } from './status.mjs';
import { identify } from './tools.mjs';

const LOG_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const DEFAULT_HEARTBEAT_SECONDS = 30;

export function defaultLogDir(env = process.env) {
  return env.REIS_MOBILE_LOG_DIR || join(tmpdir(), 'reis-mobile', 'logs');
}

const kb = (bytes) => (bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`);
const percent = (shown, raw) => (raw ? `-${(100 - (100 * shown) / raw).toFixed(raw > 10_000 ? 1 : 0)}%` : '-0%');

/** Removes logs older than a week so the directory does not grow without bound. */
export async function pruneLogs(dir, now = Date.now()) {
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  await Promise.all(entries.filter((name) => name.endsWith('.log')).map(async (name) => {
    const path = join(dir, name);
    try {
      if (now - (await stat(path)).mtimeMs > LOG_RETENTION_MS) await rm(path, { force: true });
    } catch {
      // Another run may have removed it.
    }
  }));
}

export function logName(tool, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const slug = tool.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'command';
  return `${stamp}-${slug}-${process.pid}.log`;
}

/** The heartbeat interval in milliseconds: `--heartbeat`, then REIS_MOBILE_HEARTBEAT, then 30 s. 0 turns it off. */
export function heartbeatInterval(seconds, env = process.env) {
  const value = seconds ?? env.REIS_MOBILE_HEARTBEAT;
  if (value === undefined || value === '') return DEFAULT_HEARTBEAT_SECONDS * 1000;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error('--heartbeat must be a number of seconds, or 0 to turn it off');
  return number * 1000;
}

/**
 * Prints a status line whenever nothing was shown for `intervalMs`: how long the command has
 * run and the last thing it printed, so a quiet build never looks like a hang and a hang is
 * visible as one. `touch()` restarts the interval after a shown line.
 */
export function startHeartbeat({ intervalMs, tool, started, write, latest }) {
  const state = { count: 0, touch() {}, stop() {} };
  if (!intervalMs) return state;
  let last = Date.now();
  const timer = setInterval(() => {
    const now = Date.now();
    if (now - last < intervalMs) return;
    last = now;
    state.count++;
    const { line, at } = latest();
    const output = line ? `last output ${duration(now - at)} ago: ${truncate(line, 160)}` : 'no output yet';
    write(statusLine(tool, [`running ${duration(now - started)}`, output]));
  }, Math.max(50, Math.min(1000, intervalMs / 4)));
  timer.unref();
  state.touch = () => {
    last = Date.now();
  };
  state.stop = () => clearInterval(timer);
  return state;
}

/**
 * Runs a command and prints a compact view of its output. The exit code is the command's.
 *
 * @param {string[]} argv the command; a single string with spaces runs through the shell
 * @param {{ cwd?: string, raw?: boolean, maxLines?: number, mode?: string, log?: boolean,
 *   logDir?: string, json?: boolean, heartbeat?: number, ready?: RegExp, readyUrl?: string,
 *   stdout?: NodeJS.WritableStream, stderr?: NodeJS.WritableStream, env?: NodeJS.ProcessEnv }} options
 */
export async function runCommand(argv, options = {}) {
  const { cwd = process.cwd(), raw = false, json = false, env = process.env } = options;
  const out = options.stdout ?? process.stdout;
  const err = options.stderr ?? process.stderr;
  if (!argv.length) throw new Error('Nothing to run. Usage: reis-mobile run [options] -- <command> [args...]');

  const shell = argv.length === 1 && /\s/.test(argv[0]);
  const [file, args] = shell ? [argv[0], []] : [argv[0], argv.slice(1)];
  const spawnOptions = { cwd, env, shell: shell || process.platform === 'win32' };

  if (raw) {
    const child = spawn(file, args, { ...spawnOptions, stdio: 'inherit' });
    return exitCodeOf(child, err);
  }

  const detected = identify(argv);
  const { tool } = detected;
  const mode = options.mode ?? detected.mode;
  if (!['compact', 'light', 'stream'].includes(mode)) throw new Error(`--mode must be compact, light or stream, not "${mode}"`);
  const intervalMs = heartbeatInterval(options.heartbeat, env);
  const started = Date.now();

  let logPath = null;
  let log = null;
  let logAtLineStart = true;
  const logWrite = (text) => {
    if (!log || !text) return;
    log.write(text);
    logAtLineStart = text.endsWith('\n');
  };
  // Status lines go to the log too, on a line of their own, so anyone tailing it sees them.
  const logStatus = (line) => logWrite(`${logAtLineStart ? '' : '\n'}${line}\n`);
  if (options.log !== false) {
    const dir = options.logDir ?? defaultLogDir(env);
    await mkdir(dir, { recursive: true });
    await pruneLogs(dir);
    logPath = join(dir, logName(tool));
    log = createWriteStream(logPath);
    logWrite(`$ ${argv.join(' ')}\n# cwd: ${cwd}\n\n`);
  }
  const status = (line) => {
    err.write(`${line}\n`);
    logStatus(line);
  };

  if (detected.endless && !out.isTTY) {
    err.write(`${statusLine(tool, ['keeps running until stopped', 'to get control back once it is ready, run it with reis-mobile run --background -- <command>'])}\n`);
  }

  let lastDataAt = null;
  let heartbeat = null;
  const lines = [];
  let readyAfter = null;
  const readiness = createReadiness({
    pattern: options.ready ?? detected.ready ?? null,
    url: options.readyUrl ?? detected.readyUrl ?? null,
    body: options.readyUrl ? null : detected.readyBody ?? null,
    onReady: (reason) => {
      readyAfter = Date.now() - started;
      status(statusLine(tool, [`ready after ${duration(readyAfter)}`, reason && `signal: ${truncate(reason, 160)}`]));
      heartbeat?.touch();
    },
  });
  const compactor = new Compactor({
    mode,
    families: detected.families,
    streamFilter: detected.streamFilter,
    maxLines: options.maxLines ?? 150,
    observe: (line) => readiness.observe(line),
    emit: (line) => {
      heartbeat?.touch();
      if (json) lines.push(line);
      else out.write(`${line}\n`);
    },
  });
  heartbeat = startHeartbeat({
    intervalMs,
    tool,
    started,
    write: (line) => err.write(`${line}\n`),
    latest: () => ({ line: compactor.latest(), at: lastDataAt }),
  });

  const child = spawn(file, args, { ...spawnOptions, stdio: ['inherit', 'pipe', 'pipe'] });
  const onData = (chunk) => {
    const text = chunk.toString('utf8');
    lastDataAt = Date.now();
    logWrite(text.split('\n').map(cleanLine).join('\n'));
    compactor.push(text);
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);

  const exitCode = await exitCodeOf(child, err);
  heartbeat.stop();
  readiness.stop();
  const stats = compactor.end(exitCode);
  const elapsed = Date.now() - started;
  if (log) {
    logStatus(statusLine(tool, [`exit ${exitCode}`, duration(elapsed)]));
    await new Promise((resolve) => log.end(resolve));
  }

  const hidden = [
    stats.hiddenWarnings && `${stats.hiddenWarnings} more warnings`,
    stats.hiddenInfos && `${stats.hiddenInfos} more notices`,
    stats.duplicates && `${stats.duplicates} repeated`,
    stats.overLimit && `${stats.overLimit} over the --max-lines limit`,
  ].filter(Boolean);
  const result = {
    command: argv.join(' '),
    tool,
    mode,
    exitCode,
    durationMs: elapsed,
    readyAfterMs: readyAfter,
    heartbeats: heartbeat.count,
    lines: { raw: stats.rawLines, shown: stats.shownLines },
    bytes: { raw: stats.rawBytes, shown: stats.shownBytes },
    hidden: { warnings: stats.hiddenWarnings, notices: stats.hiddenInfos, repeated: stats.duplicates, overLimit: stats.overLimit },
    log: logPath,
  };

  if (json) {
    out.write(`${JSON.stringify({ ...result, output: lines }, null, 2)}\n`);
  } else {
    err.write(`${statusLine(tool, [
      `exit ${exitCode}`,
      duration(elapsed),
      `${stats.rawLines} → ${stats.shownLines} lines`,
      `${kb(stats.rawBytes)} → ${kb(stats.shownBytes)} (${percent(stats.shownBytes, stats.rawBytes)})`,
      hidden.length && hidden.join(', '),
      logPath ? `full log: ${logPath}` : 'no log saved',
    ])}\n`);
  }
  return exitCode;
}

export function exitCodeOf(child, err) {
  return new Promise((resolve) => {
    child.on('error', (error) => {
      err.write(`reis-mobile run: ${error.code === 'ENOENT' ? `command not found: ${error.path ?? ''}` : error.message}\n`);
      resolve(127);
    });
    child.on('close', (code, signal) => {
      if (signal) resolve(128 + (constants.signals[signal] ?? 1));
      else resolve(code ?? 1);
    });
  });
}
