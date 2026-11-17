import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { PLUGIN_ROOT } from '../core/paths.mjs';
import { sessionContext } from '../core/session/context.mjs';

async function flutterProject() {
  const dir = await mkdtemp(join(tmpdir(), 'reis-session-'));
  await writeFile(join(dir, 'pubspec.yaml'), 'name: app\ndependencies:\n  flutter:\n    sdk: flutter\n');
  await mkdir(join(dir, 'lib'));
  await writeFile(join(dir, 'lib', 'main.dart'), 'void main() {}\n');
  return dir;
}

const hook = (input, env = {}) => spawnSync(process.execPath, [join(PLUGIN_ROOT, 'bin', 'session-context.mjs')], {
  input: JSON.stringify(input),
  encoding: 'utf8',
  env: { ...process.env, PLUGIN_ROOT: '', ...env },
});

describe('session context', () => {
  it('gives a mobile project the progress, background and decision rules', async () => {
    const dir = await flutterProject();
    const context = await sessionContext(dir, { env: {} });
    assert.match(context, /^reis-mobile: Flutter project at /);
    assert.match(context, /Never run a command that does not end on its own in the foreground/);
    assert.match(context, /run --background -- <command>/);
    assert.match(context, /alternatives you rejected/);
    assert.match(context, /docs[/\\]agent-context\.md/);
  });

  it('stays silent outside a mobile project and when turned off', async () => {
    assert.equal(await sessionContext(await mkdtemp(join(tmpdir(), 'reis-session-')), { env: {} }), null);
    assert.equal(await sessionContext(await flutterProject(), { env: { REIS_MOBILE_SESSION_CONTEXT: '0' } }), null);
  });

  it('answers the SessionStart hook with additional context', async () => {
    const dir = await flutterProject();
    const result = hook({ hook_event_name: 'SessionStart', source: 'startup', cwd: dir });
    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
    assert.match(output.hookSpecificOutput.additionalContext, /Flutter project/);

    assert.equal(hook({ cwd: dir }, { PLUGIN_ROOT: '/codex/plugin' }).stdout, '');
    assert.equal(hook({ cwd: await mkdtemp(join(tmpdir(), 'reis-session-')) }).stdout, '');
  });

  it('is registered on every session start, including after /clear and compaction', () => {
    const config = JSON.parse(readFileSync(join(PLUGIN_ROOT, 'hooks', 'hooks.json'), 'utf8'));
    const group = config.hooks.SessionStart.find((entry) => /session-context\.mjs/.test(entry.hooks[0].command));
    assert.equal(group.matcher, 'startup|resume|clear|compact');
    assert.equal(group.hooks[0].timeout, 3);
  });
});
