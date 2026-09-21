import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { PLUGIN_ROOT } from '../core/paths.mjs';
import { FLUTTER_APP, git, makeProject } from './helpers/fixtures.mjs';

const cli = (...args) => spawnSync(process.execPath, [join(PLUGIN_ROOT, 'bin/reis-mobile.mjs'), ...args], { encoding: 'utf8' });
const releaseReference = (name) => join(PLUGIN_ROOT, 'skills/mobile-release/references', `${name}.md`);

describe('release context', () => {
  for (const [stack, files, platforms, references] of [
    ['flutter', FLUTTER_APP, ['android', 'ios'], ['flutter', 'android', 'ios']],
    ['android', { 'settings.gradle': '', 'app/src/main/AndroidManifest.xml': '<manifest/>' }, ['android'], ['android']],
    ['ios', { 'App.xcodeproj/project.pbxproj': '' }, ['ios'], ['ios']],
    ['react-native', { 'package.json': '{"dependencies":{"react-native":"0.76.0","expo":"52.0.0"}}' }, ['android', 'ios'], ['react-native', 'android', 'ios']],
    ['kotlin-multiplatform', { 'shared/build.gradle.kts': 'plugins { kotlin("multiplatform") }\nkotlin { androidTarget(); iosArm64() }' }, ['android', 'ios'], ['kotlin-multiplatform', 'android', 'ios']],
  ]) {
    it(`prepares ${stack} release routing and all native references`, async () => {
      const dir = await makeProject(files);
      const result = cli('release', '--dir', dir, '--json', '--lang', 'pt', '--intent', 'debug', '--', 'Android build crash');
      assert.equal(result.status, 0, result.stderr);
      const output = JSON.parse(result.stdout);
      assert.equal(output.intent, 'release');
      assert.equal(output.intentSource, 'explicit');
      assert.equal(output.agent.name, 'mobile-release-engineer');
      assert.equal(output.stack, stack);
      assert.ok(output.skills.some((skill) => skill.name === 'mobile-release'));
      assert.equal(output.language, 'pt');
      assert.equal(output.detection.projectDir, dir);
      assert.equal(output.doctor.detection.projectDir, dir);
      assert.deepEqual(output.release.platforms, platforms);
      assert.deepEqual(output.release.references, references.map(releaseReference));
      assert.equal(output.release.evidenceStatus, 'unverified');
      assert.equal(output.release.verdict, null);
      for (const reference of output.release.references) assert.ok(existsSync(reference));
    });
  }

  it('resolves the monorepo app, redacts context and preserves the project', async () => {
    const dir = await makeProject({
      '.reis-mobile/config.yaml': 'app: apps/mobile\n',
      ...Object.fromEntries(Object.entries(FLUTTER_APP).map(([path, content]) => [`apps/mobile/${path}`, content])),
    });
    git(dir, 'init');
    git(dir, 'add', '.');
    git(dir, 'commit', '-m', 'fixture');
    const secret = 'AIza' + 'a'.repeat(35);
    await writeFile(join(dir, 'apps/mobile/lib/main.dart'), `final apiKey = '${secret}';\n`);
    const before = git(dir, 'diff');
    const status = git(dir, 'status', '--porcelain');
    const result = cli('release', '--dir', dir, '--json');
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.detection.projectDir, join(dir, 'apps/mobile'));
    assert.equal(output.projectConfig, join(dir, '.reis-mobile/config.yaml'));
    assert.deepEqual(output.context.files.map((file) => file.path), ['apps/mobile/lib/main.dart']);
    assert.ok(!result.stdout.includes(secret));
    assert.match(output.context.diff, /\*{8}/);
    assert.equal(git(dir, 'diff'), before);
    assert.equal(git(dir, 'status', '--porcelain'), status);
  });

  it('does not infer detected targets from a prompt for an unknown project', async () => {
    const result = cli('release', '--dir', await makeProject(), '--json', '--', 'ship Flutter to both stores');
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.detection.stack, 'unknown');
    assert.deepEqual(output.release.platforms, []);
    assert.deepEqual(output.release.references, []);
    assert.equal(output.release.evidenceStatus, 'unverified');
    assert.equal(output.release.verdict, null);
    assert.ok(output.warnings.some((warning) => warning.includes('No mobile project found')));
  });

  it('does not execute a requested release script or claim a readiness verdict', async () => {
    const dir = await makeProject({ 'package.json': JSON.stringify({
      dependencies: { 'react-native': '0.76.0' },
      scripts: { release: 'node -e "require(\'node:fs\').writeFileSync(\'uploaded\', \'\')"' },
    }) });
    const result = cli('release', '--dir', dir, '--', 'run npm run release');
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes(`Project     ${dir}`));
    assert.match(result.stdout, /Release context prepared; readiness has not been evaluated/);
    assert.equal(existsSync(join(dir, 'uploaded')), false);
    assert.match(cli('release', '--help').stdout, /release \[request\.\.\.\].*does not build or publish/);
  });
});
