import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { MARKETPLACE_URL, PLUGIN_ID, installClaudePlugin, uninstallClaudePlugin } from '../core/install/claude-plugin.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';
import { checkVersions, readVersions } from '../scripts/versions.mjs';

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
});

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
