import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { appendFile, mkdir, open, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { PLUGIN_ROOT } from '../paths.mjs';
import { Compactor, cleanLine, truncate } from './compact.mjs';
import { createReadiness, describeReady } from './readiness.mjs';
import { defaultLogDir, exitCodeOf, heartbeatInterval, logName, pruneLogs, startHeartbeat } from './runner.mjs';
import { EXIT_LINE, READY_LINE, duration, statusLine } from './status.mjs';
import { identify } from './tools.mjs';

/**
 * `reis-mobile run --background` for commands that keep running: an app session, an emulator,
 * a dev server. A detached supervisor runs the command and writes its output, a ready line and
 * an exit line to the log; the caller follows that log and gets control back when the command
 * is ready, ends, or the wait runs out, with the PID, the log and the stop command.
 *
 *   log header   $ <command> / # cwd / # started / # ready / # pid, then a blank line
 *   ready line   [reis-mobile run: <tool> · ready after 48s · signal: ...]
 *   exit line    [reis-mobile run: <tool> · exit 1 · 2m05s]
 */

const CLI = join(PLUGIN_ROOT, 'bin', 'reis-mobile.mjs');
const SELF = `node "${CLI}" run`;
export const DEFAULT_WAIT_SECONDS = 100;
export const WAIT_EXPIRED = 124;
const SETTLE_MS = 10_000;
const POLL_MS = 200;
const STOP_GRACE_MS = 10_000;

const readinessOf = (detected, options) => ({
  pattern: options.ready ?? detected.ready ?? null,
  url: options.readyUrl ?? detected.readyUrl ?? null,
  body: options.readyUrl ? null : detected.readyBody ?? null,
});

/** Starts the command under a detached supervisor, then follows its log. */
export async function startBackground(argv, options = {}) {
  const { cwd = process.cwd(), env = process.env } = options;
  if (!argv.length) throw new Error('Nothing to run. Usage: reis-mobile run --background -- <command> [args...]');
  const detected = identify(argv);
  const dir = options.logDir ?? defaultLogDir(env);
  await mkdir(dir, { recursive: true });
  await pruneLogs(dir);
  const logPath = join(dir, logName(detected.tool));
  const signal = describeReady(readinessOf(detected, options));
  await writeFile(logPath, `$ ${argv.join(' ')}\n# cwd: ${cwd}\n# started: ${new Date().toISOString()}\n# ready: ${signal ?? 'none'}\n`);

  const args = [CLI, 'run', '--supervise', logPath, '--dir', cwd];
  if (options.ready) args.push('--ready', options.ready.source);
  if (options.readyUrl) args.push('--ready-url', options.readyUrl);
  args.push('--', ...argv);
  const child = spawn(process.execPath, args, { cwd, env, detached: true, stdio: 'ignore', windowsHide: true });
  const failure = await new Promise((resolve) => {
    child.once('error', resolve);
    child.once('spawn', () => resolve(null));
  });
  if (failure) throw failure;
  child.unref();
  return followLog(logPath, { ...options, fromStart: true, settle: true, pid: child.pid });
}

/** Runs inside the detached process: the command's output, ready and exit lines go to the log. */
export async function supervise(argv, { logPath, cwd = process.cwd(), env = process.env, ready, readyUrl } = {}) {
  const detected = identify(argv);
  const log = createWriteStream(logPath, { flags: 'a' });
  let atLineStart = true;
  const write = (text) => {
    if (!text) return;
    log.write(text);
    atLineStart = text.endsWith('\n');
  };
  const status = (line) => write(`${atLineStart ? '' : '\n'}${line}\n`);
  write(`# pid: ${process.pid}\n\n`);
  // A stop signal reaches the whole process group; staying alive lets the exit line be written.
  for (const name of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(name, () => {});

  const started = Date.now();
  const readiness = createReadiness({
    ...readinessOf(detected, { ready, readyUrl }),
    onReady: (reason) => status(statusLine(detected.tool, [`ready after ${duration(Date.now() - started)}`, reason && `signal: ${truncate(reason, 160)}`])),
  });
  const shell = argv.length === 1 && /\s/.test(argv[0]);
  const child = spawn(argv[0], shell ? [] : argv.slice(1), {
    cwd, env, shell: shell || process.platform === 'win32', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  let pending = '';
  const onData = (chunk) => {
    const text = chunk.toString('utf8');
    write(text.split('\n').map(cleanLine).join('\n'));
    pending += text;
    const lines = pending.split('\n');
    pending = lines.pop();
    for (const line of lines) readiness.observe(cleanLine(line).replace(/\s+$/, ''));
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  const code = await exitCodeOf(child, { write });
  if (pending) readiness.observe(cleanLine(pending));
  readiness.stop();
  status(statusLine(detected.tool, [`exit ${code}`, duration(Date.now() - started)]));
  await new Promise((resolve) => log.end(resolve));
  return code;
}

/** Reads the header and the ready and exit lines already in a log. */
function scanLog(text) {
  const header = { command: null, cwd: null, started: null, ready: null, pid: null };
  let ready = null;
  let exit = null;
  let inHeader = true;
  for (const line of text.split('\n')) {
    if (inHeader) {
      if (!line.trim()) inHeader = false;
      else readHeaderLine(header, line);
      continue;
    }
    const exitMatch = line.match(EXIT_LINE);
    if (exitMatch) exit = { code: Number(exitMatch[2]), after: exitMatch[3] ?? null, line };
    else if (READY_LINE.test(line)) ready = { line, after: line.match(READY_LINE)[2] };
  }
  return { header, ready, exit };
}

function readHeaderLine(header, line) {
  if (line.startsWith('$ ')) header.command = line.slice(2);
  else if (line.startsWith('# cwd: ')) header.cwd = line.slice(7);
  else if (line.startsWith('# started: ')) header.started = Date.parse(line.slice(11)) || null;
  else if (line.startsWith('# ready: ')) header.ready = line.slice(9);
  else if (line.startsWith('# pid: ')) header.pid = Number(line.slice(7)) || null;
}

const toolOf = (header) => (header.command ? identify([header.command]) : { tool: 'command', mode: 'light', families: ['common'] });

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

/**
 * Follows a log until the command is ready, ends or the wait runs out.
 *
 * Returns 0 when it is ready or running, the command's exit code when it ended, and 124 when
 * the wait ran out before it was ready (it is still running).
 */
export async function followLog(logPath, options = {}) {
  const out = options.stdout ?? process.stdout;
  const err = options.stderr ?? process.stderr;
  const env = options.env ?? process.env;
  const waitMs = (options.wait ?? DEFAULT_WAIT_SECONDS) * 1000;
  const settleMs = options.settleMs ?? SETTLE_MS;
  const following = Date.now();

  let handle;
  try {
    handle = await open(logPath, 'r');
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`No log at ${logPath}. Use the path that reis-mobile run --background printed.`);
    throw error;
  }

  const header = { command: null, cwd: null, started: null, ready: null, pid: options.pid ?? null };
  let inHeader = true;
  let pending = '';
  let offset = 0;
  let detected = null;
  let compactor = null;
  let heartbeat = null;
  let replaying = true;
  let showReplay = options.fromStart ?? null;
  let earlier = 0;
  let readySeenBefore = false;
  let ready = null;
  let exit = null;
  let lastDataAt = null;

  const setup = () => {
    detected = toolOf(header);
    // A compact view of the whole log is short; replaying an app's log output is not.
    if (showReplay === null) showReplay = detected.mode === 'compact';
    compactor = new Compactor({
      mode: detected.mode,
      families: detected.families,
      streamFilter: detected.streamFilter,
      emit: (line) => {
        heartbeat?.touch();
        out.write(`${line}\n`);
      },
    });
    heartbeat = startHeartbeat({
      intervalMs: heartbeatInterval(options.heartbeat, env),
      tool: detected.tool,
      started: header.started ?? following,
      write: (line) => err.write(`${line}\n`),
      latest: () => ({ line: compactor.latest(), at: lastDataAt }),
    });
  };

  const take = (line) => {
    if (inHeader) {
      if (!line.trim()) {
        inHeader = false;
        if (!detected) setup();
      } else {
        readHeaderLine(header, line);
      }
      return;
    }
    const exitMatch = line.match(EXIT_LINE);
    if (exitMatch) {
      exit = { code: Number(exitMatch[2]), after: exitMatch[3] ?? null };
      return;
    }
    const readyMatch = line.match(READY_LINE);
    if (readyMatch) {
      // When following a log someone else started, readiness reached earlier is old news.
      if (replaying && !options.fromStart) readySeenBefore = true;
      ready = { after: readyMatch[2], line };
      if (!replaying || showReplay) err.write(`${line}\n`);
      return;
    }
    if (replaying && !showReplay) {
      earlier++;
      return;
    }
    lastDataAt = Date.now();
    compactor.push(`${line}\n`);
  };

  const readMore = async () => {
    const buffer = Buffer.alloc(64 * 1024);
    for (;;) {
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, offset);
      if (!bytesRead) return;
      offset += bytesRead;
      pending += buffer.toString('utf8', 0, bytesRead);
      const lines = pending.split('\n');
      pending = lines.pop();
      for (const line of lines) take(line);
    }
  };

  const finish = (outcome) => {
    heartbeat?.stop();
    const tool = detected?.tool ?? toolOf(header).tool;
    const pid = header.pid ?? options.pid;
    const follow = `follow: ${SELF} --follow "${logPath}"`;
    const stop = `stop: ${SELF} --stop "${logPath}"`;
    const log = `full log: ${logPath}`;
    const skipped = earlier && `${earlier} earlier lines only in the log`;
    const latest = compactor?.latest();
    const last = latest && lastDataAt ? `last output ${duration(Date.now() - lastDataAt)} ago: ${truncate(latest, 160)}` : latest && `last output: ${truncate(latest, 160)}`;
    let code = 0;
    let parts;
    if (outcome === 'exit') {
      compactor?.end(exit.code);
      code = exit.code;
      parts = [`exit ${exit.code}`, exit.after, skipped, log];
    } else {
      compactor?.end(0);
      if (outcome === 'ready') parts = [`ready after ${ready.after}`, `running in the background, pid ${pid}`, follow, stop, log];
      else if (outcome === 'running') parts = [`running for ${duration(settleMs)} with no readiness signal for this tool (give --ready <regex> or --ready-url <url> to wait for one)`, `pid ${pid}`, last, follow, stop, log];
      else if (outcome === 'watching') parts = [`still running after ${duration(Date.now() - following)} of watching, pid ${pid}`, ready && `ready since ${ready.after}`, skipped, follow, stop, log];
      else if (outcome === 'waiting') {
        code = WAIT_EXPIRED;
        parts = [`not ready after ${duration(Date.now() - (header.started ?? following))}; still running in the background, pid ${pid}`, last, `keep waiting: ${SELF} --follow "${logPath}"`, stop, log];
      } else {
        code = 1;
        parts = ['the process ended without writing an exit status (killed?)', last, log];
      }
    }
    err.write(`${statusLine(tool, parts)}\n`);
    return code;
  };

  try {
    await readMore();
    replaying = false;
    if (!detected) setup();
    if (exit) return finish('exit');
    let lastAliveCheck = 0;
    for (;;) {
      await readMore();
      if (exit) return finish('exit');
      if (ready && !readySeenBefore) return finish('ready');
      const now = Date.now();
      const pid = header.pid ?? options.pid;
      if (pid && now - lastAliveCheck >= 1000) {
        lastAliveCheck = now;
        if (!isAlive(pid)) {
          await sleep(POLL_MS);
          await readMore();
          return finish(exit ? 'exit' : 'vanished');
        }
      }
      if (options.settle && detected.settle !== false && header.ready === 'none' && now - (header.started ?? following) >= settleMs) return finish('running');
      if (now - following >= waitMs) return finish(ready ? 'watching' : 'waiting');
      await sleep(POLL_MS);
    }
  } finally {
    heartbeat?.stop();
    await handle.close();
  }
}

/** The command line of a process, or null when it cannot be read. */
function commandLineOf(pid) {
  const result = process.platform === 'win32'
    ? spawnSync('powershell', ['-NoProfile', '-Command', `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").CommandLine`], { encoding: 'utf8', windowsHide: true })
    : spawnSync('ps', ['-o', 'command=', '-p', String(pid)], { encoding: 'utf8' });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim() || null;
}

function signalGroup(pid, signal) {
  try {
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
    else process.kill(-pid, signal);
  } catch {
    // Already gone.
  }
}

/** Stops a command started with --background: its whole process group, then SIGKILL after a grace period. */
export async function stopBackground(logPath, options = {}) {
  const err = options.stderr ?? process.stderr;
  const graceMs = options.graceMs ?? STOP_GRACE_MS;
  let text;
  try {
    text = await readFile(logPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`No log at ${logPath}. Use the path that reis-mobile run --background printed.`);
    throw error;
  }
  const { header, exit } = scanLog(text);
  const { tool } = toolOf(header);
  const log = `full log: ${logPath}`;
  if (exit) {
    err.write(`${statusLine(tool, [`already ended with exit ${exit.code}`, exit.after, log])}\n`);
    return 0;
  }
  const { pid } = header;
  if (!pid) throw new Error(`${logPath} has no supervisor PID; only commands started with reis-mobile run --background can be stopped this way.`);
  if (!isAlive(pid)) {
    err.write(`${statusLine(tool, [`not running (pid ${pid} is gone)`, log])}\n`);
    return 0;
  }
  // A PID can be reused after its process ends: stop only the supervisor of this log.
  const commandLine = commandLineOf(pid);
  if (commandLine !== null && !(commandLine.includes('--supervise') && commandLine.includes(logPath))) {
    err.write(`${statusLine(tool, [`pid ${pid} is no longer this command's supervisor; nothing was stopped`, log])}\n`);
    return 1;
  }

  const started = Date.now();
  signalGroup(pid, 'SIGTERM');
  let killed = false;
  while (isAlive(pid)) {
    if (Date.now() - started >= graceMs) {
      signalGroup(pid, 'SIGKILL');
      killed = true;
      await sleep(500);
      break;
    }
    await sleep(POLL_MS);
  }
  const after = scanLog(await readFile(logPath, 'utf8'));
  if (after.exit) {
    err.write(`${statusLine(tool, [`stopped with exit ${after.exit.code}`, after.exit.after, log])}\n`);
  } else {
    const line = statusLine(tool, ['exit 137', killed ? `killed after ${duration(graceMs)} without exiting` : 'stopped']);
    await appendFile(logPath, `\n${line}\n`);
    err.write(`${statusLine(tool, [killed ? `killed (SIGKILL) after ${duration(graceMs)} without exiting` : 'stopped', log])}\n`);
  }
  return 0;
}
