import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { planRelease, validateReleaseTag } from '../scripts/release-plan.mjs';

describe('release plan', () => {
  it('publishes a new stable version above the latest tag', () => {
    assert.deepEqual(planRelease('0.7.1', ['v0.6.0', 'v0.7.0']), { tag: 'v0.7.1', release: true });
  });

  it('does not create a second release for an existing tag', () => {
    assert.deepEqual(planRelease('0.7.1', ['v0.7.0', 'v0.7.1']), { tag: 'v0.7.1', release: false });
  });

  it('rejects a version behind a newer release', () => {
    assert.throws(() => planRelease('0.7.1', ['v0.7.0', 'v0.8.0']), /newer than v0\.8\.0/);
  });

  it('rejects malformed versions and mismatched retry tags', () => {
    assert.throws(() => planRelease('0.7.1-beta.1', ['v0.7.0']), /stable version/);
    assert.throws(() => validateReleaseTag('0.7.1', 'v0.7.0'), /does not match/);
    assert.deepEqual(validateReleaseTag('0.7.1', 'v0.7.1'), { tag: 'v0.7.1', release: true });
  });
});
