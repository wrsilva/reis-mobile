import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { detectStack } from '../core/detection/stack-detector.mjs';
import { FLUTTER_APP, makeProject } from './helpers/fixtures.mjs';

describe('detectStack', () => {
  it('detects a Flutter app with its native languages and platforms', async () => {
    const dir = await makeProject({ ...FLUTTER_APP, 'web/': '' });

    const result = await detectStack(dir);

    assert.equal(result.stack, 'flutter');
    assert.equal(result.language, 'dart');
    assert.deepEqual(result.languages, ['dart', 'kotlin', 'swift']);
    assert.deepEqual(result.platforms, ['android', 'ios', 'web']);
    assert.equal(result.variant, null);
  });

  it('does not report native Android or iOS as the primary stack of a Flutter app', async () => {
    const dir = await makeProject({
      ...FLUTTER_APP,
      'android/settings.gradle': '',
      'ios/Podfile': "platform :ios, '13.0'\n",
    });

    const result = await detectStack(dir);

    assert.equal(result.stack, 'flutter');
    assert.deepEqual(result.candidates.map((candidate) => candidate.stack), ['flutter']);
  });

  it('marks Flutter plugins', async () => {
    const dir = await makeProject({
      'pubspec.yaml': `${FLUTTER_APP['pubspec.yaml']}  plugin:\n    platforms:\n      android:\n        package: dev.reis.demo\n`,
    });

    assert.equal((await detectStack(dir)).variant, 'plugin');
  });

  it('ignores pure Dart packages', async () => {
    const dir = await makeProject({ 'pubspec.yaml': 'name: cli_tool\nenvironment:\n  sdk: ^3.5.0\n' });

    assert.equal((await detectStack(dir)).stack, 'unknown');
  });

  it('detects React Native with TypeScript', async () => {
    const dir = await makeProject({
      'package.json': JSON.stringify({ dependencies: { react: '19.0.0', 'react-native': '0.79.0' } }),
      'tsconfig.json': '{}',
      'android/app/src/main/java/com/demo/MainApplication.kt': '',
      'ios/Demo/AppDelegate.swift': '',
    });

    const result = await detectStack(dir);

    assert.equal(result.stack, 'react-native');
    assert.equal(result.language, 'typescript');
    assert.deepEqual(result.platforms, ['android', 'ios']);
  });

  it('detects an Expo managed project without native folders', async () => {
    const dir = await makeProject({
      'package.json': JSON.stringify({ dependencies: { expo: '~53.0.0', 'react-native': '0.79.0' } }),
    });

    const result = await detectStack(dir);

    assert.equal(result.stack, 'react-native');
    assert.equal(result.variant, 'expo');
    assert.equal(result.language, 'javascript');
    assert.deepEqual(result.platforms, ['android', 'ios']);
  });

  it('ignores web projects that do not depend on react-native', async () => {
    const dir = await makeProject({ 'package.json': JSON.stringify({ dependencies: { react: '19.0.0' } }) });

    assert.equal((await detectStack(dir)).stack, 'unknown');
  });

  it('detects Kotlin Multiplatform before plain Android', async () => {
    const dir = await makeProject({
      'settings.gradle.kts': 'include(":composeApp")\n',
      'composeApp/build.gradle.kts': [
        'plugins { alias(libs.plugins.kotlinMultiplatform); alias(libs.plugins.androidApplication) }',
        'kotlin {',
        '  androidTarget()',
        '  iosArm64()',
        '  iosSimulatorArm64()',
        '}',
        'android { namespace = "dev.reis.demo" }',
        'plugins { id("com.android.application") }',
      ].join('\n'),
      'composeApp/src/androidMain/AndroidManifest.xml': '<manifest/>',
    });

    const result = await detectStack(dir);

    assert.equal(result.stack, 'kotlin-multiplatform');
    assert.deepEqual(result.platforms, ['android', 'ios']);
    assert.ok(result.candidates.some((candidate) => candidate.stack === 'android'));
  });

  it('detects a native Android app written in Kotlin', async () => {
    const dir = await makeProject({
      'settings.gradle.kts': 'include(":app")\n',
      'app/build.gradle.kts': 'plugins { id("com.android.application") }\n',
      'app/src/main/AndroidManifest.xml': '<manifest/>',
      'app/src/main/java/dev/reis/demo/MainActivity.kt': 'class MainActivity\n',
    });

    const result = await detectStack(dir);

    assert.equal(result.stack, 'android');
    assert.deepEqual(result.languages, ['kotlin']);
    assert.deepEqual(result.platforms, ['android']);
  });

  it('does not treat a JVM-only Gradle project as Android', async () => {
    const dir = await makeProject({
      'settings.gradle.kts': 'rootProject.name = "server"\n',
      'build.gradle.kts': 'plugins { kotlin("jvm") }\n',
    });

    assert.equal((await detectStack(dir)).stack, 'unknown');
  });

  it('detects a native iOS app from its Xcode project', async () => {
    const dir = await makeProject({
      'Demo.xcodeproj/project.pbxproj': '',
      'Demo/DemoApp.swift': '@main struct DemoApp {}\n',
      'Demo/Legacy.m': '',
      'Demo/Other.swift': '',
    });

    const result = await detectStack(dir);

    assert.equal(result.stack, 'ios');
    assert.deepEqual(result.languages, ['swift', 'objective-c']);
  });

  it('only treats Swift packages that target iOS as iOS projects', async () => {
    const server = await makeProject({ 'Package.swift': 'platforms: [.macOS(.v14)]' });
    const app = await makeProject({ 'Package.swift': 'platforms: [.iOS(.v17)]' });

    assert.equal((await detectStack(server)).stack, 'unknown');
    assert.equal((await detectStack(app)).stack, 'ios');
  });

  it('skips dependency and build folders when scanning languages', async () => {
    const dir = await makeProject({
      'Demo.xcodeproj/project.pbxproj': '',
      'Demo/App.swift': '',
      'Pods/Alamofire/Legacy.m': '',
      'node_modules/lib/index.js': '',
    });

    assert.deepEqual((await detectStack(dir)).languages, ['swift']);
  });

  it('returns unknown for an empty directory', async () => {
    const result = await detectStack(await makeProject());

    assert.equal(result.stack, 'unknown');
    assert.deepEqual(result.candidates, []);
  });
});
