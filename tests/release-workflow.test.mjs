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

it('configures the Git identity before the optional commit and annotated tag', () => {
  const workflow = readFileSync(join(PLUGIN_ROOT, '.github/workflows/release.yml'), 'utf8');
  const name = workflow.indexOf("git config user.name 'github-actions[bot]'");
  const email = workflow.indexOf("git config user.email '41898282+github-actions[bot]@users.noreply.github.com'");
  const optionalCommit = workflow.indexOf('if ! git diff --cached --quiet; then');
  const tag = workflow.indexOf('git tag -a ');
  assert.ok(name >= 0 && name < email && email < optionalCommit && optionalCommit < tag);
});
