import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { PLUGIN_ROOT } from '../core/paths.mjs';
import { evaluateReadiness } from '../skills/mobile-release/scripts/verdict.mjs';
import { makeProject } from './helpers/fixtures.mjs';

// The acceptance contract, intentionally independent of implementation constants.
const gates = ['identity', 'build', 'tests', 'analysis', 'version', 'signing', 'symbols', 'store', 'privacy', 'listing', 'rollout'];
const passingTarget = (target = 'android') => ({ target, gates: gates.map((id) => ({
  id, status: 'pass', evidence: [`audit/${target}/${id}.txt:1`], nextAction: 'None.',
})) });

describe('readiness verdict', () => {
  it('returns GO only when every required gate of both targets passes with evidence', () => {
    const result = evaluateReadiness({ targets: [passingTarget(), passingTarget('ios')] });
    assert.equal(result.verdict, 'GO');
    assert.deepEqual(result.blockers, []);
    assert.deepEqual(result.unknowns, []);
  });

  it('returns GO WITH RISKS for explicit non-blocking risks after all gates pass', () => {
    const risks = [{ id: 'cohort-size', description: 'Release owner accepts a smaller initial cohort.', evidence: ['rollout.md:12'], mitigation: 'Expand after the first monitoring review.', owner: 'Release owner' }];
    const result = evaluateReadiness({ targets: [passingTarget()], risks });
    assert.equal(result.verdict, 'GO WITH RISKS');
    assert.deepEqual(result.risks, risks);
  });

  for (const status of ['fail', 'unknown']) {
    it(`blocks both-store readiness when the iOS signing gate is ${status}`, () => {
      const ios = passingTarget('ios');
      const signing = ios.gates.find((gate) => gate.id === 'signing');
      Object.assign(signing, { status, evidence: status === 'fail' ? ['archive/signing.txt:7'] : [], nextAction: 'Release owner must provide the signed archive and profile.' });
      const result = evaluateReadiness({ targets: [passingTarget(), ios], risks: [{ id: 'cosmetic', description: 'Accepted cosmetic issue.', evidence: ['issue.md:1'], mitigation: 'Schedule for the next release.', owner: 'Product owner' }] });
      assert.equal(result.verdict, 'NO-GO');
      assert.equal(result.blockers.length, 1);
      assert.equal(result.blockers[0].target, 'ios');
      assert.equal(result.blockers[0].id, 'signing');
      assert.equal(result.blockers[0].nextAction, signing.nextAction);
      assert.equal(result.unknowns.length, status === 'unknown' ? 1 : 0);
    });
  }

  it('turns every missing required gate into an unknown blocker', () => {
    const result = evaluateReadiness({ targets: [{ target: 'android', gates: [] }] });
    assert.equal(result.verdict, 'NO-GO');
    assert.deepEqual(result.unknowns.map((gate) => gate.id), gates);
    assert.ok(result.unknowns.every((gate) => gate.nextAction.length > 0));
    assert.equal(result.blockers.length, gates.length);
  });

  it('does not accept pass without an evidence reference', () => {
    const android = passingTarget();
    android.gates[0].evidence = [' '];
    const result = evaluateReadiness({ targets: [android] });
    assert.equal(result.verdict, 'NO-GO');
    assert.equal(result.unknowns[0].id, 'identity');
    assert.equal(result.unknowns[0].status, 'unknown');
  });

  it('cannot approve an empty target set', () => {
    const result = evaluateReadiness({ targets: [] });
    assert.equal(result.verdict, 'NO-GO');
    assert.equal(result.unknowns[0].id, 'targets');
  });

  it('rejects malformed statuses, duplicate gates and duplicate target names', () => {
    const invalid = passingTarget();
    invalid.gates[0].status = 'approved';
    assert.throws(() => evaluateReadiness({ targets: [invalid] }), /status/);
    const duplicate = passingTarget();
    duplicate.gates.push(duplicate.gates[0]);
    assert.throws(() => evaluateReadiness({ targets: [duplicate] }), /duplicate/i);
    assert.throws(() => evaluateReadiness({ targets: [passingTarget(), passingTarget()] }), /duplicate/i);
    assert.throws(() => evaluateReadiness({ targets: [passingTarget()], risks: 'fine' }), /risks/);
    assert.throws(() => evaluateReadiness({ targets: [passingTarget()], risks: ['fine'] }), /risks/);
    assert.throws(() => evaluateReadiness({ targets: [passingTarget()], risks: [{ id: 'risky' }] }), /risks/);
  });

  it('reads stdin without writing files and distinguishes a verdict from an input error', () => {
    const script = join(PLUGIN_ROOT, 'skills/mobile-release/scripts/verdict.mjs');
    const run = (input) => spawnSync(process.execPath, [script], { input, encoding: 'utf8' });
    const blocked = run(JSON.stringify({ targets: [] }));
    assert.equal(blocked.status, 0);
    assert.equal(JSON.parse(blocked.stdout).verdict, 'NO-GO');
    const malformed = run('{');
    assert.equal(malformed.status, 1);
    assert.equal(malformed.stdout, '');
    assert.match(malformed.stderr, /readiness:/);
  });

  it('evaluates when installed under a symlinked directory', async () => {
    const dir = await makeProject();
    await symlink(PLUGIN_ROOT, join(dir, 'plugin'), 'junction');
    const result = spawnSync(process.execPath, [join(dir, 'plugin/skills/mobile-release/scripts/verdict.mjs')], {
      input: '{"targets":[]}', encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).verdict, 'NO-GO');
  });
});
