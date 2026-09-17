import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { planReleaseDocs, syncReleaseDocs } from '../scripts/release-docs.mjs';

const MARKERS = '<!-- reis-mobile:latest-release:start -->\nOld summary\n<!-- reis-mobile:latest-release:end -->';
const OLD_RELEASE = '## [0.7.1] - 2026-09-17\n\n### Added\n\n- Historical note.\n';

function fixture(version, unreleased = '### Added\n\n- New release note.') {
  const root = mkdtempSync(join(tmpdir(), 'reis-mobile-release-docs-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ version }));
  writeFileSync(join(root, 'CHANGELOG.md'), `# Changelog\n\n## [Unreleased]\n\n${unreleased}\n\n${OLD_RELEASE}`);
  writeFileSync(join(root, 'README.md'), `# reis-mobile\n\n${MARKERS}\n\n| v0.7.1 | Historical highlight |\n| v0.8.0 | Roadmap target |\n`);
  return root;
}

describe('release Markdown synchronization', () => {
  it('promotes authored notes, updates the README and keeps history and roadmap intact', () => {
    const root = fixture('0.7.2');
    try {
      const plan = planReleaseDocs(root, '2026-09-18');
      assert.deepEqual(syncReleaseDocs(plan, root), ['CHANGELOG.md', 'README.md']);
      const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
      const readme = readFileSync(join(root, 'README.md'), 'utf8');
      assert.match(changelog, /## \[Unreleased\]\n\n## \[0\.7\.2\] - 2026-09-18\n\n### Added\n\n- New release note\./);
      assert.ok(changelog.includes(OLD_RELEASE));
      assert.match(readme, /### v0\.7\.2\n\n#### Added\n\n- New release note\./);
      assert.match(readme, /\| v0\.7\.1 \| Historical highlight \|/);
      assert.match(readme, /\| v0\.8\.0 \| Roadmap target \|/);

      const before = [changelog, readme];
      assert.deepEqual(syncReleaseDocs(planReleaseDocs(root, '2026-09-19'), root), []);
      assert.deepEqual(['CHANGELOG.md', 'README.md'].map((path) => readFileSync(join(root, path), 'utf8')), before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('keeps an existing release date while refreshing its README summary', () => {
    const root = fixture('0.7.1', '');
    try {
      const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
      assert.deepEqual(syncReleaseDocs(planReleaseDocs(root, '2026-10-01'), root), ['README.md']);
      assert.equal(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), changelog);
      assert.match(readFileSync(join(root, 'README.md'), 'utf8'), /### v0\.7\.1\n\n#### Added\n\n- Historical note\./);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects a new version without authored notes or with malformed release headings', () => {
    const root = fixture('0.7.2', '');
    try {
      const before = ['CHANGELOG.md', 'README.md'].map((path) => readFileSync(join(root, path), 'utf8'));
      assert.throws(() => planReleaseDocs(root, '2026-09-18'), /needs notes under \[Unreleased\]/);
      assert.deepEqual(['CHANGELOG.md', 'README.md'].map((path) => readFileSync(join(root, path), 'utf8')), before);

      writeFileSync(join(root, 'CHANGELOG.md'), before[0].replace('## [0.7.1] - 2026-09-17', '## [0.7.1]'));
      assert.throws(() => planReleaseDocs(root, '2026-09-18'), /invalid dated release heading/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
