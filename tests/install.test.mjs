import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MARKETPLACE_URL, PLUGIN_ID } from '../core/install/claude-plugin.mjs';
import { installCodexPlugin, uninstallCodexPlugin } from '../core/install/codex-plugin.mjs';
import { runInit } from '../core/install/init.mjs';

const recorder = (statuses = []) => {
  const calls = [];
  const run = (args) => {
    calls.push(args.join(' '));
    return statuses.shift() ?? 0;
  };
  return { calls, run };
};

const state = ({ plugins = [], marketplaces = [] } = {}) => () => ({ plugins, marketplaces });

describe('Codex plugin install', () => {
  it('adds and upgrades the GitHub marketplace, then adds the plugin', () => {
    const { calls, run } = recorder();

    assert.deepEqual(installCodexPlugin({ run, list: state() }), { ok: true });
    assert.deepEqual(calls, [
      `plugin marketplace add ${MARKETPLACE_URL}`,
      'plugin marketplace upgrade reis-mobile',
      `plugin add ${PLUGIN_ID}`,
    ]);
  });

  it('skips the upgrade for a local marketplace, which Codex only allows for Git sources', () => {
    const { calls, run } = recorder();

    installCodexPlugin({ source: '/opt/reis-mobile', run, list: state() });

    assert.deepEqual(calls, ['plugin marketplace add /opt/reis-mobile', `plugin add ${PLUGIN_ID}`]);
  });

  it('removes the "mobile" plugin from v0.3.2 and v0.3.3 after adding reis-mobile', () => {
    const { calls, run } = recorder();

    installCodexPlugin({ run, list: state({ plugins: ['mobile@reis-mobile'] }) });

    assert.deepEqual(calls.slice(-2), [`plugin add ${PLUGIN_ID}`, 'plugin remove mobile@reis-mobile']);
  });

  it('stops at the first failing step', () => {
    const { calls, run } = recorder([0, 1]);

    assert.deepEqual(installCodexPlugin({ run, list: state() }), {
      ok: false,
      failedStep: 'codex plugin marketplace upgrade reis-mobile',
      status: 1,
    });
    assert.equal(calls.length, 2);
  });

  it('removes the plugin and then the marketplace', () => {
    const { calls, run } = recorder();

    uninstallCodexPlugin({ run, list: state({ plugins: [PLUGIN_ID], marketplaces: ['reis-mobile'] }) });

    assert.deepEqual(calls, [`plugin remove ${PLUGIN_ID}`, 'plugin marketplace remove reis-mobile']);
  });

  it('does not remove a marketplace that is not configured, which Codex treats as an error', () => {
    const { calls, run } = recorder();

    assert.deepEqual(uninstallCodexPlugin({ run, list: state() }), { ok: true });
    assert.deepEqual(calls, []);
  });
});

describe('runInit', () => {
  const target = (id, outcome = { ok: true }) => {
    const calls = [];
    return {
      calls,
      target: {
        id,
        name: id,
        bin: id,
        install: (options) => (calls.push(['install', options]), outcome),
        uninstall: (options) => (calls.push(['uninstall', options]), outcome),
      },
    };
  };

  it('installs in every tool whose CLI is available', () => {
    const claude = target('claude');
    const codex = target('codex');

    const { ok, results } = runInit({ targets: [claude.target, codex.target], exists: () => true });

    assert.equal(ok, true);
    assert.deepEqual(results.map((result) => [result.id, result.ok]), [['claude', true], ['codex', true]]);
    assert.equal(claude.calls[0][0], 'install');
    assert.equal(codex.calls[0][0], 'install');
  });

  it('skips a tool that is not installed', () => {
    const claude = target('claude');
    const codex = target('codex');

    const { ok, results } = runInit({ targets: [claude.target, codex.target], exists: (bin) => bin === 'claude' });

    assert.equal(ok, true);
    assert.deepEqual(results[1], { id: 'codex', name: 'codex', skipped: true });
    assert.equal(codex.calls.length, 0);
  });

  it('keeps going after one tool fails, and reports the failure', () => {
    const claude = target('claude', { ok: false, failedStep: 'claude plugin install', status: 1 });
    const codex = target('codex');

    const { ok, results } = runInit({ targets: [claude.target, codex.target], exists: () => true });

    assert.equal(ok, false);
    assert.equal(results[1].ok, true);
    assert.equal(codex.calls.length, 1);
  });

  it('fails when no tool is available', () => {
    const { ok } = runInit({ targets: [target('claude').target, target('codex').target], exists: () => false });

    assert.equal(ok, false);
  });

  it('passes the local source and the scope, and uninstalls when asked', () => {
    const claude = target('claude');

    runInit({ uninstall: true, source: '/opt/reis-mobile', scope: 'project', targets: [claude.target], exists: () => true });

    assert.deepEqual(claude.calls, [['uninstall', { scope: 'project', source: '/opt/reis-mobile' }]]);
  });
});
