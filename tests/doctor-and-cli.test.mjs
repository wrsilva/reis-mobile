import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { runDoctor } from '../core/diagnostics/doctor.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';
import { FLUTTER_APP, git, makeProject } from './helpers/fixtures.mjs';

const byId = (report, id) => report.checks.find((check) => check.id === id);

describe('runDoctor', () => {
  it('checks tools and project files relevant to a Flutter app', async () => {
    const dir = await makeProject({
      ...FLUTTER_APP,
      'ios/Podfile': "platform :ios, '13.0'\n",
      'android/gradle/wrapper/gradle-wrapper.properties':
        'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.12-all.zip\n',
    });

    const report = await runDoctor({ projectDir: dir, platform: 'linux' });

    assert.equal(byId(report, 'stack').detail, 'flutter · dart, kotlin, swift');
    assert.equal(byId(report, 'pubspec-lock').status, 'warning');
    assert.equal(byId(report, 'gradle-wrapper').detail, '8.12');
    assert.equal(byId(report, 'podfile-lock').status, 'warning');
    assert.equal(byId(report, 'xcode').status, 'skipped');
    assert.equal(byId(report, 'git').status, 'ok');
    assert.ok(byId(report, 'flutter'), 'Flutter is checked for Flutter projects');
    assert.equal(byId(report, 'npm'), undefined, 'npm is irrelevant without package.json');
    assert.equal(report.status, 'warning');
  });

  it('warns when there is no mobile project', async () => {
    const report = await runDoctor({ projectDir: await makeProject() });

    assert.equal(byId(report, 'stack').status, 'warning');
    assert.equal(byId(report, 'flutter'), undefined);
  });
});

describe('reis-mobile CLI', () => {
  const cli = (...args) => spawnSync(process.execPath, [join(PLUGIN_ROOT, 'bin/reis-mobile.mjs'), ...args], { encoding: 'utf8' });

  it('validates the plugin', () => {
    const result = cli('validate');

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /✓ \d+ stacks, \d+ agents, \d+ skills/);
  });

  it('prints review routing as JSON', async () => {
    const dir = await makeProject(FLUTTER_APP);

    const result = cli('review', '--json', '--dir', dir);
    const output = JSON.parse(result.stdout);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(output.agent.name, 'mobile-code-reviewer');
    assert.equal(output.context.mode, 'project');
  });

  for (const [stack, agent, files, request] of [
    ['flutter', 'flutter-test-engineer', FLUTTER_APP, 'fix the Android build crash'],
    ['android', 'android-test-engineer', { 'settings.gradle': '', 'app/src/main/AndroidManifest.xml': '<manifest/>' }, 'run Espresso tests'],
    ['ios', 'ios-test-engineer', { 'App.xcodeproj/project.pbxproj': '' }, 'write XCTest and XCUITest coverage'],
    ['react-native', 'rn-test-engineer', { 'package.json': JSON.stringify({ dependencies: { 'react-native': '0.76.0' } }) }, 'audit component behavior'],
  ]) {
    it(`prepares ${stack} test context with an explicit test intent`, async () => {
      const dir = await makeProject(files);
      const result = cli('test', '--dir', dir, '--json', '--lang', 'pt', '--intent', 'debug', '--', request);

      assert.equal(result.status, 0, result.stderr);
      const output = JSON.parse(result.stdout);
      assert.equal(output.intent, 'test');
      assert.equal(output.intentSource, 'explicit');
      assert.equal(output.agent.name, agent);
      assert.equal(output.stack, stack);
      assert.ok(output.skills.some((skill) => skill.name === 'mobile-test'));
      assert.equal(output.language, 'pt');
      assert.equal(output.detection.projectDir, dir);
      assert.equal(output.doctor.detection.projectDir, dir);
      assert.equal(output.context.mode, 'project');
      if (stack === 'flutter') assert.deepEqual(output.platformFocus, ['android']);
    });
  }

  it('keeps monorepo test context inside the configured app and redacts its diff', async () => {
    const root = await makeProject({
      '.reis-mobile/config.yaml': 'app: apps/mobile\n',
      'apps/web/package.json': '{}',
      ...Object.fromEntries(Object.entries(FLUTTER_APP).map(([path, source]) => [`apps/mobile/${path}`, source])),
    });
    git(root, 'init');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'initial');
    const secret = 'AIza' + 'a'.repeat(35);
    await writeFile(join(root, 'apps/mobile/lib/main.dart'), `final apiKey = '${secret}';\n`);
    await writeFile(join(root, 'apps/web/package.json'), '{"changed":true}');

    const result = cli('test', '--json', '--dir', join(root, 'apps/web'), '--lang', 'en');
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.detection.projectDir, join(root, 'apps/mobile'));
    assert.equal(output.doctor.detection.projectDir, join(root, 'apps/mobile'));
    assert.equal(output.projectConfig, join(root, '.reis-mobile/config.yaml'));
    assert.deepEqual(output.context.files.map((file) => file.path), ['apps/mobile/lib/main.dart']);
    assert.equal(output.context.mode, 'working-tree');
    assert.match(output.context.diff, /apiKey = '\*{8}'/);
    assert.ok(!result.stdout.includes(secret));
  });

  it('accepts a base revision and reports an invalid revision as a failure', async () => {
    const dir = await makeProject(FLUTTER_APP);
    git(dir, 'init');
    git(dir, 'add', '.');
    git(dir, 'commit', '-m', 'initial');
    await writeFile(join(dir, 'lib/main.dart'), 'void main() { runApp(); }\n');
    git(dir, 'add', '.');
    git(dir, 'commit', '-m', 'change');

    const result = cli('test', '--dir', dir, '--base', 'HEAD~1', '--json', '--lang', 'en');
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.context.mode, 'range');
    assert.equal(output.context.base, 'HEAD~1');
    assert.deepEqual(output.context.files.map((file) => file.path), ['lib/main.dart']);

    const invalid = cli('test', '--dir', dir, '--base', 'missing-ref');
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /git diff missing-ref\.\.\.HEAD failed/);
  });

  it('prepares context without executing the requested package test script', async () => {
    const dir = await makeProject({
      'package.json': JSON.stringify({
        dependencies: { 'react-native': '0.76.0' },
        scripts: { test: 'node -e "require(\'node:fs\').writeFileSync(\'runner-started\', \'\')"' },
      }),
    });

    const result = cli('test', '--dir', dir, '--lang', 'en', '--', 'run npm test');

    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes(`Project     ${dir}`));
    assert.match(result.stdout, /^Intent {6}test \(explicit\)$/m);
    assert.match(result.stdout, /^Language {4}en$/m);
    assert.match(result.stdout, /no test suites were executed/);
    assert.equal(existsSync(join(dir, 'runner-started')), false);
  });

  it('shows warnings for an unknown project without claiming tests ran', async () => {
    const result = cli('test', '--dir', await makeProject(), '--json', '--lang', 'en');

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.intent, 'test');
    assert.equal(output.agent.name, 'mobile-staff-engineer');
    assert.ok(output.warnings.some((warning) => warning.includes('No mobile project found')));
    assert.ok(output.skills.some((skill) => skill.name === 'mobile-test'));
  });

  it('documents the context-only test command and its base option in help', () => {
    const result = cli('test', '--help');

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /test \[request\.\.\.\].*does not run tests/);
    assert.match(result.stdout, /--base <ref> +review\/test:/);
  });

  it('exits with 2 when detect finds no mobile project', async () => {
    assert.equal(cli('detect', '--dir', await makeProject()).status, 2);
  });

  it('rejects unknown commands', () => {
    const result = cli('deploy');

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unknown command "deploy"/);
  });
});
