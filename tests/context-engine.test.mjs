import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { collectReviewContext } from '../core/context/context-engine.mjs';
import { FLUTTER_APP, git, makeProject } from './helpers/fixtures.mjs';

async function committedFlutterRepo() {
  const dir = await makeProject({ ...FLUTTER_APP, 'pubspec.lock': 'packages: {}\n' });
  git(dir, 'init', '-q');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'init');
  return dir;
}

describe('collectReviewContext', () => {
  it('reviews the whole project outside a git repository', async () => {
    const context = collectReviewContext({ projectDir: await makeProject(FLUTTER_APP) });

    assert.equal(context.mode, 'project');
    assert.deepEqual(context.files, []);
  });

  it('reviews the whole project when nothing changed', async () => {
    const context = collectReviewContext({ projectDir: await committedFlutterRepo() });

    assert.equal(context.mode, 'project');
  });

  it('collects modified and untracked files with a redacted diff', async () => {
    const dir = await committedFlutterRepo();
    await writeFile(join(dir, 'lib/main.dart'), "void main() {}\nconst apiKey = 'live_secret_value_123';\n");
    await writeFile(join(dir, 'lib/new_screen.dart'), 'class NewScreen {}\n');
    await writeFile(join(dir, 'pubspec.lock'), 'packages: {changed: true}\n');

    const context = collectReviewContext({ projectDir: dir });

    assert.equal(context.mode, 'working-tree');
    assert.deepEqual(context.files, [
      { status: 'modified', path: 'lib/main.dart' },
      { status: 'modified', path: 'pubspec.lock' },
      { status: 'untracked', path: 'lib/new_screen.dart' },
    ]);
    assert.match(context.diff, /const apiKey = '\*{8}'/);
    assert.doesNotMatch(context.diff, /live_secret_value_123/);
    assert.doesNotMatch(context.diff, /pubspec\.lock/, 'lock files stay out of the diff body');
  });

  it('compares a base ref with HEAD', async () => {
    const dir = await committedFlutterRepo();
    git(dir, 'checkout', '-qb', 'feature');
    await writeFile(join(dir, 'lib/feature.dart'), 'class Feature {}\n');
    git(dir, 'add', '-A');
    git(dir, 'commit', '-qm', 'feature');

    const context = collectReviewContext({ projectDir: dir, base: 'main' });

    assert.equal(context.mode, 'range');
    assert.deepEqual(context.files, [{ status: 'added', path: 'lib/feature.dart' }]);
    assert.match(context.diff, /class Feature/);
  });

  it('fails clearly on an unknown base ref', async () => {
    const dir = await committedFlutterRepo();

    assert.throws(() => collectReviewContext({ projectDir: dir, base: 'does-not-exist' }), /git diff does-not-exist\.\.\.HEAD failed/);
  });

  it('truncates large diffs and says so', async () => {
    const dir = await committedFlutterRepo();
    await writeFile(join(dir, 'lib/main.dart'), `${'// line\n'.repeat(500)}`);

    const context = collectReviewContext({ projectDir: dir, maxDiffBytes: 200 });

    assert.equal(context.diffTruncated, true);
    assert.ok(Buffer.byteLength(context.diff) <= 200);
    assert.match(context.note, /truncated/);
  });

  it('lists staged files in a repository without commits', async () => {
    const dir = await makeProject(FLUTTER_APP);
    git(dir, 'init', '-q');
    git(dir, 'add', 'lib/main.dart');

    const context = collectReviewContext({ projectDir: dir });

    assert.equal(context.mode, 'working-tree');
    assert.deepEqual(context.files[0], { status: 'added', path: 'lib/main.dart' });
    assert.ok(context.files.some((file) => file.status === 'untracked' && file.path === 'pubspec.yaml'));
  });
});
