import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { PLUGIN_ROOT } from '../core/paths.mjs';
import { checkForUpdate, clearUpdateCache, compareVersions, updateMessage } from '../core/update/check.mjs';

describe('update checks', () => {
  it('compares numeric versions and rejects unorderable versions', () => {
    assert.equal(compareVersions('0.7.0', '0.10.0'), -1);
    assert.equal(compareVersions('0.7.0', '0.7.0'), 0);
    assert.equal(compareVersions('1.0.0', '0.9.9'), 1);
    assert.equal(compareVersions('0.8.0-beta.1', '0.8.0'), -1);
    assert.equal(compareVersions('invalid', '0.8.0'), null);
  });

  it('caches a successful lookup for 24 hours and refreshes after expiry', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'reis-mobile-update-'));
    try {
      const cachePath = join(dir, 'update.json');
      let calls = 0;
      const options = {
        current: '0.7.0',
        cachePath,
        fetchVersion: async () => { calls++; return calls === 1 ? '0.8.0' : '0.9.0'; },
      };
      assert.deepEqual(await checkForUpdate({ ...options, now: 1000 }), { status: 'outdated', current: '0.7.0', latest: '0.8.0' });
      assert.deepEqual(await checkForUpdate({ ...options, now: 2000 }), { status: 'outdated', current: '0.7.0', latest: '0.8.0' });
      assert.equal(calls, 1);
      assert.deepEqual(await checkForUpdate({ ...options, now: 1000 + 24 * 60 * 60 * 1000 }), { status: 'outdated', current: '0.7.0', latest: '0.9.0' });
      assert.equal(calls, 2);
      assert.equal(JSON.parse(readFileSync(cachePath, 'utf8')).latest, '0.9.0');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('stays silent offline and retries a failed lookup after one hour', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'reis-mobile-update-'));
    try {
      let calls = 0;
      const options = {
        current: '0.7.0',
        cachePath: join(dir, 'update.json'),
        fetchVersion: async () => { calls++; throw new Error('offline'); },
      };
      assert.deepEqual(await checkForUpdate({ ...options, now: 1000 }), { status: 'unavailable', current: '0.7.0' });
      assert.deepEqual(await checkForUpdate({ ...options, now: 2000 }), { status: 'unavailable', current: '0.7.0' });
      assert.equal(calls, 1);
      await checkForUpdate({ ...options, now: 1000 + 60 * 60 * 1000 });
      assert.equal(calls, 2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('removes its cache on uninstall', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'reis-mobile-update-'));
    try {
      const cachePath = join(dir, 'reis-mobile', 'update-check.json');
      mkdirSync(join(dir, 'reis-mobile'));
      writeFileSync(cachePath, '{}');
      await clearUpdateCache(cachePath);
      assert.equal(existsSync(cachePath), false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('gives each host its own plugin update command', () => {
    const result = { current: '0.7.0', latest: '0.8.0' };
    assert.match(updateMessage(result, 'claude'), /claude plugin marketplace update reis-mobile/);
    assert.match(updateMessage(result, 'codex'), /codex plugin marketplace upgrade reis-mobile/);
  });

  it('emits a user-visible hook warning only for an outdated plugin', () => {
    const dir = mkdtempSync(join(tmpdir(), 'reis-mobile-update-'));
    try {
      const cacheDir = join(dir, 'reis-mobile');
      mkdirSync(cacheDir);
      const cachePath = join(cacheDir, 'update-check.json');
      const current = JSON.parse(readFileSync(join(PLUGIN_ROOT, 'package.json'), 'utf8')).version;
      const hook = join(PLUGIN_ROOT, 'bin', 'update-check.mjs');
      const env = { ...process.env, XDG_CACHE_HOME: dir, CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT };
      delete env.PLUGIN_ROOT;
      delete env.REIS_MOBILE_UPDATE_CHECK;
      writeFileSync(cachePath, JSON.stringify({ checkedAt: Date.now(), latest: '99.0.0' }));
      const outdated = spawnSync(process.execPath, [hook], { env, encoding: 'utf8' });
      assert.equal(outdated.status, 0);
      assert.match(JSON.parse(outdated.stdout).systemMessage, new RegExp(`reis-mobile ${current.replaceAll('.', '\\.')}`));
      writeFileSync(cachePath, JSON.stringify({ checkedAt: Date.now(), latest: current }));
      const currentRun = spawnSync(process.execPath, [hook], { env, encoding: 'utf8' });
      assert.equal(currentRun.status, 0);
      assert.equal(currentRun.stdout, '');
      writeFileSync(cachePath, JSON.stringify({ checkedAt: Date.now(), latest: '99.0.0' }));
      const disabled = spawnSync(process.execPath, [hook], { env: { ...env, REIS_MOBILE_UPDATE_CHECK: '0' }, encoding: 'utf8' });
      assert.equal(disabled.stdout, '');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports the cached result through the CLI without changing it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'reis-mobile-update-'));
    try {
      const cacheDir = join(dir, 'reis-mobile');
      mkdirSync(cacheDir);
      writeFileSync(join(cacheDir, 'update-check.json'), JSON.stringify({ checkedAt: Date.now(), latest: '99.0.0' }));
      const result = spawnSync(process.execPath, [join(PLUGIN_ROOT, 'bin', 'reis-mobile.mjs'), 'update-check', '--json'], {
        env: { ...process.env, XDG_CACHE_HOME: dir },
        encoding: 'utf8',
      });
      assert.equal(result.status, 0);
      assert.deepEqual(JSON.parse(result.stdout), {
        status: 'outdated',
        current: JSON.parse(readFileSync(join(PLUGIN_ROOT, 'package.json'), 'utf8')).version,
        latest: '99.0.0',
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('plugin hook configuration', () => {
  it('registers the update check only on session start and resume', () => {
    const config = JSON.parse(readFileSync(join(PLUGIN_ROOT, 'hooks', 'hooks.json'), 'utf8'));
    const [group] = config.hooks.SessionStart;
    assert.equal(group.matcher, 'startup|resume');
    assert.match(group.hooks[0].command, /bin\/update-check\.mjs/);
    assert.equal(group.hooks[0].timeout, 3);
  });
});
