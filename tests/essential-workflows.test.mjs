import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { route } from '../core/router/router.mjs';
import { FLUTTER_APP, makeProject } from './helpers/fixtures.mjs';

const workflows = [
  ['privacy', 'mobile-privacy', 'implementar exclusão de conta', 'implement account deletion'],
];

const projects = [
  ['flutter', FLUTTER_APP],
  ['android', { 'settings.gradle': '', 'app/src/main/AndroidManifest.xml': '<manifest/>' }],
  ['ios', { 'App.xcodeproj/project.pbxproj': '' }],
  ['react-native', { 'package.json': JSON.stringify({ dependencies: { 'react-native': '0.76.0' } }) }],
  ['kotlin-multiplatform', {
    'settings.gradle.kts': 'include(":shared")',
    'shared/build.gradle.kts': 'plugins { id("org.jetbrains.kotlin.multiplatform") }\nkotlin { androidTarget(); iosArm64() }',
  }],
];

describe('essential mobile workflows', () => {
  for (const [intent, skill, ...prompts] of workflows) {
    for (const [stack, files] of projects) {
      it(`selects ${skill} and the staff engineer on ${stack}`, async () => {
        const result = await route({ intent, projectDir: await makeProject(files) });
        assert.equal(result.intent, intent);
        assert.equal(result.stack, stack);
        assert.equal(result.agent?.name, 'mobile-staff-engineer');
        assert.deepEqual(result.skills.map((item) => item.name), [skill]);
        assert.deepEqual(result.warnings, []);
      });
    }

    for (const prompt of prompts) {
      it(`discovers ${skill} from "${prompt}"`, async () => {
        const result = await route({ prompt, projectDir: await makeProject(FLUTTER_APP) });
        assert.equal(result.intent, intent);
        assert.equal(result.intentSource, 'prompt');
        assert.equal(result.agent?.name, 'mobile-staff-engineer');
        assert.deepEqual(result.skills.map((item) => item.name), [skill]);
      });
    }

    it(`honors an explicit test intent over a ${intent} prompt`, async () => {
      const result = await route({ intent: 'test', prompt: prompts[0], projectDir: await makeProject(FLUTTER_APP) });
      assert.equal(result.intent, 'test');
      assert.equal(result.intentSource, 'explicit');
      assert.equal(result.agent?.name, 'flutter-test-engineer');
      assert.ok(result.skills.some((item) => item.name === 'mobile-test'));
      assert.ok(!result.skills.some((item) => item.name === skill));
    });
  }
});
