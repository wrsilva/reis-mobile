import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MARKETPLACE_URL, PLUGIN_ID, installClaudePlugin, uninstallClaudePlugin } from '../core/install/claude-plugin.mjs';
import { renderFormula } from '../scripts/homebrew-formula.mjs';
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

describe('Homebrew formula', () => {
  const sha256 = 'a'.repeat(64);

  it('points at the release asset verified by install.sh', () => {
    const formula = renderFormula({ tag: 'v0.1.0', sha256 });

    assert.match(formula, /url "https:\/\/github\.com\/wrsilva\/reis-mobile\/releases\/download\/v0\.1\.0\/reis-mobile-v0\.1\.0\.tar\.gz"/);
    assert.match(formula, new RegExp(`sha256 "${sha256}"`));
    assert.match(formula, /depends_on "node"/);
  });

  it('refuses invalid input', () => {
    assert.throws(() => renderFormula({ tag: '0.1.0', sha256 }), /Invalid tag/);
    assert.throws(() => renderFormula({ tag: 'v0.1.0', sha256: 'abc' }), /Invalid sha256/);
  });
});
