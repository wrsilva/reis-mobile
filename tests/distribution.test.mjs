import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { MARKETPLACE_URL, PLUGIN_ID, installClaudePlugin, uninstallClaudePlugin } from '../core/install/claude-plugin.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';
import { checkVersions, readVersions, syncVersions } from '../scripts/versions.mjs';

describe('versions', () => {
  it('keeps package.json and the plugin manifests on the same version', () => {
    assert.deepEqual(checkVersions(readVersions()), []);
  });

  it('rejects a release tag that does not match', () => {
    const versions = { 'package.json': '0.1.0', 'plugin.json': '0.1.0' };

    assert.deepEqual(checkVersions(versions, 'v0.1.0'), []);
    assert.deepEqual(checkVersions(versions, 'v0.2.0'), ['tag v0.2.0 does not match version v0.1.0']);
    assert.equal(checkVersions({ ...versions, 'plugin.json': '0.0.9' }).length, 1);
  });

  it('synchronizes plugin manifests from package.json and leaves other fields intact', () => {
    const root = makeVersionFixture('0.7.1');
    try {
      assert.deepEqual(syncVersions(root), ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']);
      assert.deepEqual(Object.values(readVersions(root)), ['0.7.1', '0.7.1', '0.7.1', '0.7.1']);
      const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8'));
      const marketplace = JSON.parse(readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8'));
      assert.equal(plugin.description, 'Keep plugin description');
      assert.equal(marketplace.plugins[0].description, 'Keep marketplace description');
      assert.equal(marketplace.plugins[1].version, '9.9.9');
      const before = ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json'].map((path) => readFileSync(join(root, path), 'utf8'));
      assert.deepEqual(syncVersions(root), []);
      assert.deepEqual(['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json'].map((path) => readFileSync(join(root, path), 'utf8')), before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects an invalid package version without changing manifests', () => {
    const root = makeVersionFixture('not-a-version');
    try {
      const paths = ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json'];
      const before = paths.map((path) => readFileSync(join(root, path), 'utf8'));
      assert.throws(() => syncVersions(root), /stable version/);
      assert.deepEqual(paths.map((path) => readFileSync(join(root, path), 'utf8')), before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

function makeVersionFixture(version) {
  const root = mkdtempSync(join(tmpdir(), 'reis-mobile-versions-'));
  mkdirSync(join(root, '.claude-plugin'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'reis-mobile', version }));
  writeFileSync(join(root, '.claude-plugin/plugin.json'), JSON.stringify({ name: 'reis-mobile', version: '0.7.0', description: 'Keep plugin description' }));
  writeFileSync(join(root, '.claude-plugin/marketplace.json'), JSON.stringify({
    metadata: { version: '0.7.0' },
    plugins: [
      { name: 'reis-mobile', version: '0.7.0', description: 'Keep marketplace description' },
      { name: 'other', version: '9.9.9' },
    ],
  }));
  return root;
}

describe('Claude Code plugin install', () => {
  const recorder = (statuses = []) => {
    const calls = [];
    const run = (args) => {
      calls.push(args.join(' '));
      return statuses.shift() ?? 0;
    };
    return { calls, run };
  };

  const nothingInstalled = () => [];

  it('adds and refreshes the GitHub marketplace, then installs the plugin', () => {
    const { calls, run } = recorder();

    assert.deepEqual(installClaudePlugin({ run, list: nothingInstalled }), { ok: true });
    assert.deepEqual(calls, [
      `plugin marketplace add ${MARKETPLACE_URL} --scope user`,
      'plugin marketplace update reis-mobile',
      `plugin install ${PLUGIN_ID} --scope user`,
    ]);
  });

  it('updates an installed plugin instead of reinstalling it, so a new release reaches Claude Code', () => {
    const { calls, run } = recorder();

    assert.deepEqual(installClaudePlugin({ run, list: () => [PLUGIN_ID] }), { ok: true });
    assert.equal(calls.at(-1), `plugin update ${PLUGIN_ID} --scope user`);
    assert.ok(!calls.some((call) => call.startsWith('plugin install')));
  });

  it('removes the plugin installed as "mobile" by v0.3.2 and v0.3.3 after installing reis-mobile', () => {
    const { calls, run } = recorder();

    installClaudePlugin({ run, list: () => ['mobile@reis-mobile', 'other@elsewhere'] });

    assert.deepEqual(calls.slice(-2), [`plugin install ${PLUGIN_ID} --scope user`, 'plugin uninstall mobile@reis-mobile --scope user']);
  });

  it('keeps the "mobile" plugin when installing reis-mobile fails', () => {
    const { calls, run } = recorder([0, 0, 1]);

    assert.equal(installClaudePlugin({ run, list: () => ['mobile@reis-mobile'] }).ok, false);
    assert.ok(!calls.some((call) => call.includes('uninstall')));
  });

  it('installs from a local directory and scope', () => {
    const { calls, run } = recorder();

    installClaudePlugin({ source: '/opt/reis-mobile', scope: 'project', run, list: nothingInstalled });

    assert.equal(calls[0], 'plugin marketplace add /opt/reis-mobile --scope project');
  });

  it('stops at the first failing step', () => {
    const { calls, run } = recorder([1]);

    assert.deepEqual(installClaudePlugin({ run, list: nothingInstalled }), {
      ok: false,
      failedStep: `claude plugin marketplace add ${MARKETPLACE_URL} --scope user`,
      status: 1,
    });
    assert.equal(calls.length, 1);
  });

  it('uninstalls the plugin, and the "mobile" one if present, before removing the marketplace', () => {
    const { calls, run } = recorder();

    uninstallClaudePlugin({ run, list: () => ['mobile@reis-mobile'] });

    assert.deepEqual(calls, [
      `plugin uninstall ${PLUGIN_ID} --scope user`,
      'plugin uninstall mobile@reis-mobile --scope user',
      'plugin marketplace remove reis-mobile',
    ]);
  });

  it('rejects unknown scopes', () => {
    assert.throws(() => installClaudePlugin({ scope: 'global', run: () => 0, list: nothingInstalled }), /Unknown scope "global"/);
  });
});

describe('npm package', () => {
  const manifest = JSON.parse(readFileSync(join(PLUGIN_ROOT, 'package.json'), 'utf8'));

  it('ships the license notices of the third-party skills it redistributes', () => {
    assert.ok(manifest.files.includes('THIRD_PARTY_NOTICES.md'));
  });

  it('ships everything the plugins and the CLI load at runtime', () => {
    for (const path of ['.claude-plugin', 'agents', 'bin', 'commands', 'core', 'docs/agent-context.md', 'hooks', 'skills', 'stacks']) {
      assert.ok(manifest.files.includes(path), `package.json "files" is missing ${path}`);
    }
    assert.equal(manifest.bin['reis-mobile'], 'bin/reis-mobile.mjs');
  });
});
