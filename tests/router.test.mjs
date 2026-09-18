import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { route, selectSkills } from '../core/router/router.mjs';
import { FLUTTER_APP, makeProject } from './helpers/fixtures.mjs';

const names = (items) => items.map((item) => item.name);

describe('route', () => {
  // Plan §39: the MVP is proven when /reis-mobile:review on a Flutter project selects the
  // reviewer agent with the Flutter and security skills.
  it('routes /reis-mobile:review on a Flutter project to the MVP agent and skills', async () => {
    const dir = await makeProject(FLUTTER_APP);

    const result = await route({ intent: 'review', projectDir: dir });

    assert.equal(result.stack, 'flutter');
    assert.equal(result.agent.name, 'mobile-code-reviewer');
    for (const skill of ['mobile-code-review', 'mobile-security']) {
      assert.ok(names(result.skills).includes(skill), `${skill} is selected`);
    }
    assert.equal(names(result.skills).at(-1), 'mobile-security', 'stack-agnostic skills come last');
    assert.deepEqual(result.warnings, []);
  });

  for (const [intent, agent, skill] of [
    ['architecture', 'flutter-architect', 'mobile-architecture'],
    ['performance', 'flutter-performance-engineer', 'mobile-code-review'],
    ['test', 'flutter-test-engineer', 'mobile-test'],
    ['debug', 'mobile-staff-engineer', 'mobile-debug'],
    ['accessibility', 'mobile-accessibility-auditor', 'mobile-accessibility'],
    ['release', 'mobile-release-engineer', 'mobile-release'],
    ['deployment', 'mobile-release-engineer', 'mobile-release'],
  ]) {
    it(`routes ${intent} on Flutter to ${agent} with ${skill}`, async () => {
      const result = await route({ intent, projectDir: await makeProject(FLUTTER_APP) });

      assert.equal(result.agent.name, agent);
      assert.ok(names(result.skills).includes(skill));
    });
  }

  for (const [stack, files] of [
    ['android', { 'settings.gradle': '', 'app/src/main/AndroidManifest.xml': '<manifest/>' }],
    ['ios', { 'App.xcodeproj/project.pbxproj': '' }],
    ['rn', { 'package.json': JSON.stringify({ dependencies: { 'react-native': '0.76.0' } }) }],
  ]) {
    for (const intent of ['architecture', 'performance', 'test']) {
      const role = { architecture: 'architect', performance: 'performance-engineer', test: 'test-engineer' }[intent];

      it(`routes ${intent} on ${stack} to ${stack}-${role}`, async () => {
        const result = await route({ intent, projectDir: await makeProject(files) });

        assert.equal(result.agent.name, `${stack}-${role}`);
        assert.ok(!result.skills.some((skill) => skill.stacks.includes('flutter')));
        if (intent === 'test') assert.ok(result.skills.some((skill) => skill.name === 'mobile-test'), 'every stack gets the test skill');
      });
    }
  }

  for (const [intent, agent, topic] of [
    ['architecture', 'kmp-architect', 'mobile-architecture'],
    ['test', 'kmp-test-engineer', 'mobile-test'],
    ['performance', 'kmp-performance-engineer', 'mobile-code-review'],
  ]) {
    it(`routes KMP ${intent} to its own specialist and platform guide`, async () => {
      const dir = await makeProject({
        'settings.gradle.kts': 'include(":shared")\n',
        'shared/build.gradle.kts': 'plugins { id("org.jetbrains.kotlin.multiplatform") }\nkotlin { androidTarget(); iosArm64() }',
      });
      const result = await route({ intent, projectDir: dir });

      assert.equal(result.stack, 'kotlin-multiplatform');
      assert.equal(result.agent.name, agent);
      assert.equal(result.skills[0].name, 'mobile-kmp');
      assert.ok(names(result.skills).includes(topic));
    });
  }

  it('sends release work on native iOS to the release engineer with the iOS and release skills', async () => {
    const result = await route({ intent: 'release', projectDir: await makeProject({ 'App.xcodeproj/project.pbxproj': '' }) });

    assert.equal(result.agent.name, 'mobile-release-engineer');
    assert.deepEqual(names(result.skills).slice(0, 1), ['mobile-ios'], 'the platform skill comes first');
    assert.ok(names(result.skills).includes('mobile-release'));
  });

  it('keeps the staff engineer for native Android debugging', async () => {
    const dir = await makeProject({ 'settings.gradle': '', 'app/src/main/AndroidManifest.xml': '<manifest/>' });

    assert.equal((await route({ intent: 'debug', projectDir: dir })).agent.name, 'mobile-staff-engineer');
  });

  it('never auto-selects manual components', async () => {
    const result = await route({ intent: 'architecture', projectDir: await makeProject(FLUTTER_APP) });

    assert.ok(!names(result.skills).includes('flutter-bloc'));
    assert.notEqual(result.agent.name, 'lead-mobile');
  });

  it('keeps Flutter-only skills out of native Android reviews', async () => {
    const dir = await makeProject({
      'settings.gradle': '',
      'app/src/main/AndroidManifest.xml': '<manifest/>',
    });

    const result = await route({ intent: 'review', projectDir: dir });

    assert.equal(result.stack, 'android');
    assert.deepEqual(names(result.skills), ['mobile-code-review', 'mobile-security']);
  });

  it('reviews native iOS with the cross-platform review and security skills', async () => {
    const dir = await makeProject({ 'App.xcodeproj/project.pbxproj': '', Podfile: "platform :ios, '15.0'\n" });

    const result = await route({ intent: 'review', projectDir: dir });

    assert.equal(result.stack, 'ios');
    assert.deepEqual(names(result.skills), ['mobile-code-review', 'mobile-security']);
  });

  it('debugs a CocoaPods failure with mobile-debug and reports the area it belongs to', async () => {
    const dir = await makeProject({ 'App.xcodeproj/project.pbxproj': '', Podfile: "platform :ios, '15.0'\n" });

    const result = await route({ prompt: 'pod install falha: could not find compatible versions', intent: 'debug', projectDir: dir });

    assert.equal(result.area, 'cocoapods');
    assert.ok(names(result.skills).includes('mobile-debug'));
  });

  it('debugs the Android build of a Flutter app with mobile-debug and an Android focus', async () => {
    const dir = await makeProject(FLUTTER_APP);

    const result = await route({ prompt: 'the android gradle build fails', intent: 'debug', projectDir: dir });

    assert.equal(result.area, 'gradle');
    assert.deepEqual(result.platformFocus, ['android']);
    assert.ok(names(result.skills).includes('mobile-debug'));
  });

  it('focuses a cross-platform project on the native platform named in the prompt', async () => {
    const dir = await makeProject(FLUTTER_APP);

    const result = await route({ prompt: "Execution failed for task ':app:compileDebugKotlin'", projectDir: dir });

    assert.equal(result.intent, 'debug');
    assert.equal(result.stack, 'flutter');
    assert.deepEqual(result.platformFocus, ['android']);
  });

  it('warns instead of guessing when no agent handles the intent', async () => {
    const registry = { stacks: [], agents: [], skills: [] };

    const result = await route({ prompt: 'o app dá crash ao abrir', projectDir: await makeProject(FLUTTER_APP), registry });

    assert.equal(result.intent, 'debug');
    assert.equal(result.agent, null);
    assert.ok(result.warnings.some((warning) => warning.includes('No agent handles intent "debug"')));
  });

  it('falls back to the stack named in the prompt outside a mobile project', async () => {
    const dir = await makeProject();

    const result = await route({ prompt: 'revisar código Flutter', projectDir: dir });

    assert.equal(result.stack, 'flutter');
    assert.ok(result.warnings[0].includes('No mobile project found'));
  });

  it('rejects unknown explicit intents', async () => {
    await assert.rejects(route({ intent: 'cook', projectDir: await makeProject() }), /Unknown intent "cook"/);
  });
});

describe('selectSkills', () => {
  const skill = (name, stacks, intents = ['debug']) => ({ name, stacks, intents, routed: true });

  it('orders primary stack, then focused platforms, then stack-agnostic skills', () => {
    const skills = [
      skill('generic', ['*']),
      skill('gradle-debug', ['android']),
      skill('flutter-build-debug', ['flutter']),
      skill('xcode-debug', ['ios']),
      skill('flutter-review', ['flutter'], ['review']),
      { ...skill('manual-helper', ['*']), routed: false },
    ];

    assert.deepEqual(names(selectSkills(skills, 'debug', ['flutter', 'android'])), [
      'flutter-build-debug',
      'gradle-debug',
      'generic',
    ]);
  });

  it('puts the skill for the detected area first among skills of the same stack', () => {
    const skills = [
      { ...skill('ios-xcode-build-debug', ['ios']), areas: ['xcode', 'signing'] },
      { ...skill('ios-cocoapods-debug', ['ios']), areas: ['cocoapods'] },
      skill('ios-generic-debug', ['ios']),
      { ...skill('flutter-build-debug', ['flutter']), areas: ['pub'] },
    ];

    assert.deepEqual(names(selectSkills(skills, 'debug', ['ios'], 'cocoapods')), [
      'ios-cocoapods-debug',
      'ios-generic-debug',
      'ios-xcode-build-debug',
    ]);
  });

  it('never lets the area outrank the primary stack', () => {
    const skills = [
      { ...skill('android-gradle-build-debug', ['android']), areas: ['gradle'] },
      skill('flutter-build-debug', ['flutter']),
    ];

    assert.deepEqual(names(selectSkills(skills, 'debug', ['flutter', 'android'], 'gradle')), [
      'flutter-build-debug',
      'android-gradle-build-debug',
    ]);
  });
});
