import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { after, describe, it } from 'node:test';

import { WAIT_EXPIRED, followLog, startBackground, stopBackground } from '../core/run/background.mjs';

const sink = () => {
  const chunks = [];
  const stream = new Writable({ write(chunk, _encoding, done) { chunks.push(chunk.toString()); done(); } });
  stream.text = () => chunks.join('');
  return stream;
};
const script = (code) => ['node', '-e', code];
const logOf = (text) => text.match(/full log: (\S+\.log)/)[1];
// Stays alive like an app session until it is stopped.
const KEEP_ALIVE = 'setInterval(()=>{},1000);';

const started = [];
after(async () => {
  for (const log of started) await stopBackground(log, { stderr: sink(), graceMs: 2000 }).catch(() => {});
});

async function background(code, options = {}) {
  const stdout = sink();
  const stderr = sink();
  const logDir = await mkdtemp(join(tmpdir(), 'reis-bg-'));
  const exitCode = await startBackground(script(code), { logDir, stdout, stderr, heartbeat: 0, wait: 10, ...options });
  const log = logOf(stderr.text());
  started.push(log);
  return { exitCode, stdout: stdout.text(), stderr: stderr.text(), log };
}

describe('run --background', () => {
  it('returns once the command is ready, leaving it running, and stops it', async () => {
    const run = await background(`console.log('Launching');setTimeout(()=>console.log('App READY'),300);${KEEP_ALIVE}`, { ready: /READY/ });
    assert.equal(run.exitCode, 0);
    assert.match(run.stderr, /\[reis-mobile run: node · ready after [\d.]+s · signal: App READY\]/);
    assert.match(run.stderr, /ready after [\d.]+s · running in the background, pid \d+ · follow: .* · stop: .*--stop/);

    const stderr = sink();
    assert.equal(await stopBackground(run.log, { stderr, graceMs: 2000 }), 0);
    assert.match(stderr.text(), /stopped|killed/);
    assert.match(await readFile(run.log, 'utf8'), /^\[reis-mobile run: node · exit \d+/m);
  });

  it('returns the exit code with the error when the command fails before it is ready', async () => {
    const run = await background("console.error('lib/main.dart:3:5: Error: boom');process.exit(3)", { ready: /READY/ });
    assert.equal(run.exitCode, 3);
    assert.match(run.stdout, /lib\/main\.dart:3:5: Error: boom/);
    assert.match(run.stderr, /node · exit 3 · /);
  });

  it('returns 124 with the last output when the wait runs out first, and keeps the command running', async () => {
    const run = await background(`console.log('Running Gradle task');${KEEP_ALIVE}`, { ready: /NEVER/, wait: 1 });
    assert.equal(run.exitCode, WAIT_EXPIRED);
    assert.match(run.stderr, /not ready after [\d.]+s; still running in the background, pid \d+ · last output .*Running Gradle task · keep waiting: .*--follow/);
  });

  it('returns after a short settle when the tool has no readiness signal', async () => {
    const run = await background(KEEP_ALIVE, { settleMs: 400 });
    assert.equal(run.exitCode, 0);
    assert.match(run.stderr, /no readiness signal for this tool \(give --ready <regex> or --ready-url <url>/);
  });

  it('follows an ended command to its exit code without waiting', async () => {
    const run = await background("console.log('done');process.exit(2)");
    const stderr = sink();
    const startedAt = Date.now();
    assert.equal(await followLog(run.log, { stdout: sink(), stderr, wait: 10, heartbeat: 0 }), 2);
    assert.ok(Date.now() - startedAt < 2000);
    assert.match(stderr.text(), /exit 2/);
    assert.equal(await stopBackground(run.log, { stderr: sink() }), 0);
  });

  it('refuses to stop a process that is not the supervisor of the log', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'reis-bg-'));
    const log = join(dir, 'foreign.log');
    // The test runner's own PID: alive, but not a supervisor.
    await writeFile(log, `$ flutter run\n# cwd: ${dir}\n# started: ${new Date().toISOString()}\n# ready: none\n# pid: ${process.pid}\n\n`);
    const stderr = sink();
    assert.equal(await stopBackground(log, { stderr }), 1);
    assert.match(stderr.text(), /no longer this command's supervisor; nothing was stopped/);
  });
});
