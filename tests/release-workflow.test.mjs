import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'node:test';

import { PLUGIN_ROOT } from '../core/paths.mjs';

it('synchronizes and commits release Markdown before tagging and publishing', () => {
  const workflow = readFileSync(join(PLUGIN_ROOT, '.github/workflows/release.yml'), 'utf8');
  const sync = workflow.indexOf('node scripts/versions.mjs --sync');
  const stage = workflow.indexOf('git add ');
  const tag = workflow.indexOf('git tag -a ');
  const publish = workflow.indexOf('npm publish ');
  assert.ok(sync >= 0 && sync < stage && stage < tag && tag < publish);

  const stagedFiles = workflow.slice(stage, workflow.indexOf('\n', stage));
  for (const path of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'README.md', 'CHANGELOG.md']) {
    assert.ok(stagedFiles.split(/\s+/).includes(path), `${path} must be committed before the release tag`);
  }
});
