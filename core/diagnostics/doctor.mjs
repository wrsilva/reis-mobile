import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { createProbe } from '../detection/project-probe.mjs';
import { detectStack } from '../detection/stack-detector.mjs';

const run = promisify(execFile);
const TOOL_TIMEOUT_MS = 30_000;

const ANDROID_STACKS = ['flutter', 'android', 'react-native', 'kotlin-multiplatform'];
const IOS_STACKS = ['flutter', 'ios', 'react-native', 'kotlin-multiplatform'];

// `relevant` decides whether a tool matters for the detected project; `--all` ignores it.
const TOOLS = [
  { id: 'git', label: 'Git', section: 'environment', cmd: 'git', args: ['--version'], relevant: () => true },
  { id: 'node', label: 'Node', section: 'environment', cmd: 'node', args: ['--version'], relevant: () => true },
  { id: 'flutter', label: 'Flutter', section: 'environment', cmd: 'flutter', args: ['--version'], relevant: ({ stack }) => stack === 'flutter' },
  { id: 'dart', label: 'Dart', section: 'environment', cmd: 'dart', args: ['--version'], relevant: ({ stack }) => stack === 'flutter' },
  { id: 'java', label: 'Java', section: 'environment', cmd: 'java', args: ['-version'], relevant: targetsAndroid },
  { id: 'android-sdk', label: 'Android SDK', section: 'environment', check: checkAndroidSdk, relevant: targetsAndroid },
  { id: 'xcode', label: 'Xcode', section: 'environment', cmd: 'xcodebuild', args: ['-version'], macOnly: true, relevant: targetsIos },
  { id: 'cocoapods', label: 'CocoaPods', section: 'environment', cmd: 'pod', args: ['--version'], macOnly: true, relevant: ({ files }) => files.podfile },
  { id: 'swift', label: 'Swift', section: 'environment', cmd: 'swift', args: ['--version'], relevant: ({ stack }) => stack === 'ios' },
  { id: 'npm', label: 'npm', section: 'environment', cmd: 'npm', args: ['--version'], relevant: ({ files }) => files.packageManager === 'npm' },
  { id: 'yarn', label: 'Yarn', section: 'environment', cmd: 'yarn', args: ['--version'], relevant: ({ files }) => files.packageManager === 'yarn' },
  { id: 'pnpm', label: 'pnpm', section: 'environment', cmd: 'pnpm', args: ['--version'], relevant: ({ files }) => files.packageManager === 'pnpm' },
  { id: 'fastlane', label: 'Fastlane', section: 'environment', cmd: 'fastlane', args: ['--version'], relevant: ({ files }) => files.fastlane },
  { id: 'gh', label: 'GitHub CLI', section: 'integrations', optional: true, cmd: 'gh', args: ['--version'], relevant: () => true },
  { id: 'firebase', label: 'Firebase CLI', section: 'integrations', optional: true, cmd: 'firebase', args: ['--version'], relevant: ({ files }) => files.firebase },
];

/**
 * Environment and project diagnostics.
 *
 * Status per check: `ok`, `warning` (missing or misconfigured), `info` (optional tool
 * absent) or `skipped` (not applicable on this OS).
 */
export async function runDoctor({ projectDir = process.cwd(), all = false, platform = process.platform } = {}) {
  const detection = await detectStack(projectDir);
  const probe = createProbe(detection.projectDir);
  const files = await inspectProjectFiles(probe);
  const context = { stack: detection.stack, platforms: detection.platforms, files };

  const tools = TOOLS.filter((tool) => all || tool.relevant(context));
  const toolChecks = await Promise.all(tools.map((tool) => checkTool(tool, platform)));
  const projectChecks = await checkProject(probe, detection, files);

  const checks = [...toolChecks, ...projectChecks];
  const warnings = checks.filter((check) => check.status === 'warning').length;

  return {
    status: warnings ? 'warning' : 'ok',
    warnings,
    platform,
    detection,
    checks,
  };
}

function targetsAndroid({ stack, platforms }) {
  return ANDROID_STACKS.includes(stack) && platforms.includes('android');
}

function targetsIos({ stack, platforms }) {
  return IOS_STACKS.includes(stack) && platforms.includes('ios');
}

async function checkTool(tool, platform) {
  const base = { id: tool.id, label: tool.label, section: tool.section };
  if (tool.macOnly && platform !== 'darwin') {
    return { ...base, status: 'skipped', detail: 'requires macOS' };
  }
  if (tool.check) return { ...base, ...(await tool.check()) };

  try {
    const { stdout, stderr } = await run(tool.cmd, tool.args, { timeout: TOOL_TIMEOUT_MS });
    return { ...base, status: 'ok', detail: extractVersion(`${stdout}\n${stderr}`) };
  } catch (error) {
    const missing = error.code === 'ENOENT';
    const detail = missing ? 'not found' : error.killed ? 'timed out' : firstLine(error.stderr) || 'failed';
    return { ...base, status: tool.optional ? 'info' : 'warning', detail };
  }
}

async function checkAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    join(homedir(), 'Library', 'Android', 'sdk'),
    join(homedir(), 'Android', 'Sdk'),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
  ].filter(Boolean);
  const sdk = candidates.find((path) => existsSync(join(path, 'platform-tools')) || existsSync(join(path, 'platforms')));
  return sdk
    ? { status: 'ok', detail: sdk }
    : { status: 'warning', detail: 'not found (set ANDROID_HOME)' };
}

async function inspectProjectFiles(probe) {
  const lockfiles = [
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
    ['npm', 'package-lock.json'],
  ];
  let packageManager = null;
  for (const [manager, lockfile] of lockfiles) {
    if (await probe.exists(lockfile)) {
      packageManager = manager;
      break;
    }
  }
  if (!packageManager && (await probe.exists('package.json'))) packageManager = 'npm';

  const firebaseConfigs = await probe.findFiles(
    (name) => name === 'firebase.json' || name === 'google-services.json' || name === 'GoogleService-Info.plist',
    { maxDepth: 4, limit: 1 },
  );

  return {
    packageManager,
    podfile: (await probe.exists('Podfile')) || (await probe.exists('ios/Podfile')),
    fastlane: (await probe.isDir('fastlane')) || (await probe.isDir('android/fastlane')) || (await probe.isDir('ios/fastlane')),
    firebase: firebaseConfigs.length > 0,
  };
}

async function checkProject(probe, detection, files) {
  const checks = [
    {
      id: 'stack',
      label: 'Stack',
      section: 'project',
      status: detection.stack === 'unknown' ? 'warning' : 'ok',
      detail:
        detection.stack === 'unknown'
          ? 'no mobile project detected'
          : [detection.stack, detection.variant && `(${detection.variant})`, detection.languages.length && `· ${detection.languages.join(', ')}`]
              .filter(Boolean)
              .join(' '),
    },
  ];
  if (detection.stack === 'unknown') return checks;

  checks.push({ id: 'platforms', label: 'Platforms', section: 'project', status: 'ok', detail: detection.platforms.join(', ') || '-' });

  const add = (id, label, ok, okDetail, warningDetail) =>
    checks.push({ id, label, section: 'project', status: ok ? 'ok' : 'warning', detail: ok ? okDetail : warningDetail });

  if (detection.stack === 'flutter') {
    add('pubspec-lock', 'pubspec.lock', await probe.exists('pubspec.lock'), 'present', 'missing (run flutter pub get)');
  }

  if (detection.stack === 'react-native') {
    add('node-modules', 'node_modules', await probe.isDir('node_modules'), `installed (${files.packageManager})`, `missing (run ${files.packageManager} install)`);
  }

  const gradleDir = detection.stack === 'android' || detection.stack === 'kotlin-multiplatform' ? '.' : 'android';
  if (detection.platforms.includes('android') && (await probe.isDir(gradleDir))) {
    const wrapper = await probe.read(join(gradleDir, 'gradle', 'wrapper', 'gradle-wrapper.properties'));
    const version = /gradle-([\d.]+)-(?:all|bin)\.zip/.exec(wrapper ?? '')?.[1];
    add('gradle-wrapper', 'Gradle wrapper', Boolean(wrapper), version ?? 'present', 'missing gradle-wrapper.properties');
  }

  const iosDir = detection.stack === 'ios' ? '.' : 'ios';
  if (detection.platforms.includes('ios') && (await probe.exists(join(iosDir, 'Podfile')))) {
    add('podfile-lock', 'Podfile.lock', await probe.exists(join(iosDir, 'Podfile.lock')), 'present', 'missing (run pod install)');
  }

  return checks;
}

function extractVersion(output) {
  return /(\d+\.\d+(?:\.\d+)?)/.exec(output)?.[1] ?? firstLine(output);
}

function firstLine(text) {
  return String(text ?? '').trim().split('\n')[0]?.trim() ?? '';
}
