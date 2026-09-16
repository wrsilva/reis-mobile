import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { runDoctor } from '../core/diagnostics/doctor.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';
import { FLUTTER_APP, makeProject } from './helpers/fixtures.mjs';

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

describe('mobile CLI', () => {
  const cli = (...args) => spawnSync(process.execPath, [join(PLUGIN_ROOT, 'bin/mobile.mjs'), ...args], { encoding: 'utf8' });

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

  it('exits with 2 when detect finds no mobile project', async () => {
    assert.equal(cli('detect', '--dir', await makeProject()).status, 2);
  });

  it('rejects unknown commands', () => {
    const result = cli('deploy');

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unknown command "deploy"/);
  });
});
