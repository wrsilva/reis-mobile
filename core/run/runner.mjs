import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { constants, tmpdir } from 'node:os';
import { join } from 'node:path';

import { Compactor, cleanLine } from './compact.mjs';
import { identify } from './tools.mjs';

const LOG_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function defaultLogDir(env = process.env) {
  return env.REIS_MOBILE_LOG_DIR || join(tmpdir(), 'reis-mobile', 'logs');
}

const kb = (bytes) => (bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`);
const percent = (shown, raw) => (raw ? `-${(100 - (100 * shown) / raw).toFixed(raw > 10_000 ? 1 : 0)}%` : '-0%');

/** Removes logs older than a week so the directory does not grow without bound. */
async function pruneLogs(dir, now = Date.now()) {
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

function logName(tool, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const slug = tool.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'command';
  return `${stamp}-${slug}-${process.pid}.log`;
}

/**
 * Runs a command and prints a compact view of its output. The exit code is the command's.
 *
 * @param {string[]} argv the command; a single string with spaces runs through the shell
 * @param {{ cwd?: string, raw?: boolean, maxLines?: number, mode?: string, log?: boolean,
 *   logDir?: string, json?: boolean, stdout?: NodeJS.WritableStream, stderr?: NodeJS.WritableStream,
 *   env?: NodeJS.ProcessEnv }} options
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
  const mode = options.mode ?? detected.mode;
  if (!['compact', 'light', 'stream'].includes(mode)) throw new Error(`--mode must be compact, light or stream, not "${mode}"`);

  let logPath = null;
  let log = null;
  if (options.log !== false) {
    const dir = options.logDir ?? defaultLogDir(env);
    await mkdir(dir, { recursive: true });
    await pruneLogs(dir);
    logPath = join(dir, logName(detected.tool));
    log = createWriteStream(logPath);
    log.write(`$ ${argv.join(' ')}\n# cwd: ${cwd}\n\n`);
  }

  const lines = [];
  const compactor = new Compactor({
    mode,
    families: detected.families,
    streamFilter: detected.streamFilter,
    maxLines: options.maxLines ?? 150,
    emit: (line) => (json ? lines.push(line) : out.write(`${line}\n`)),
  });

  const child = spawn(file, args, { ...spawnOptions, stdio: ['inherit', 'pipe', 'pipe'] });
  const onData = (chunk) => {
    const text = chunk.toString('utf8');
    if (log) log.write(text.split('\n').map(cleanLine).join('\n'));
    compactor.push(text);
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);

  const exitCode = await exitCodeOf(child, err);
  const stats = compactor.end(exitCode);
  if (log) await new Promise((resolve) => log.end(resolve));

  const hidden = [
    stats.hiddenWarnings && `${stats.hiddenWarnings} more warnings`,
    stats.hiddenInfos && `${stats.hiddenInfos} more notices`,
    stats.duplicates && `${stats.duplicates} repeated`,
    stats.overLimit && `${stats.overLimit} over the --max-lines limit`,
  ].filter(Boolean);
  const result = {
    command: argv.join(' '),
    tool: detected.tool,
    mode,
    exitCode,
    lines: { raw: stats.rawLines, shown: stats.shownLines },
    bytes: { raw: stats.rawBytes, shown: stats.shownBytes },
    hidden: { warnings: stats.hiddenWarnings, notices: stats.hiddenInfos, repeated: stats.duplicates, overLimit: stats.overLimit },
    log: logPath,
  };

  if (json) {
    out.write(`${JSON.stringify({ ...result, output: lines }, null, 2)}\n`);
  } else {
    const parts = [
      `reis-mobile run: ${detected.tool}`,
      `exit ${exitCode}`,
      `${stats.rawLines} → ${stats.shownLines} lines`,
      `${kb(stats.rawBytes)} → ${kb(stats.shownBytes)} (${percent(stats.shownBytes, stats.rawBytes)})`,
      ...(hidden.length ? [hidden.join(', ')] : []),
      logPath ? `full log: ${logPath}` : 'no log saved',
    ];
    err.write(`[${parts.join(' · ')}]\n`);
  }
  return exitCode;
}

function exitCodeOf(child, err) {
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
