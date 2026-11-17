import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import { describe, it } from 'node:test';

import { parseRunArgs } from '../core/run/args.mjs';
import { Compactor, cleanLine } from '../core/run/compact.mjs';
import { handlePreToolUse, planRewrite, rewriteCommand, splitCommandLine } from '../core/run/hook.mjs';
import { runCommand } from '../core/run/runner.mjs';
import { isRunHookEnabled, readRunSettings, setRunGuard, setRunHook } from '../core/run/settings.mjs';
import { duration } from '../core/run/status.mjs';
import { READY, identify } from '../core/run/tools.mjs';

const FIXTURES = new URL('./fixtures/run/', import.meta.url);
const fixture = (name) => readFileSync(new URL(`${name}.txt`, FIXTURES), 'utf8');

/** Runs the compactor over text with the profile identify() picks for the command. */
function compact(command, text, exitCode = 1, overrides = {}) {
  const profile = { ...identify([command]), ...overrides };
  const lines = [];
  const compactor = new Compactor({ ...profile, emit: (line) => lines.push(line) });
  compactor.push(text);
  const stats = compactor.end(exitCode);
  return { lines, text: lines.join('\n'), stats, profile };
}

const sink = () => {
  const chunks = [];
  const stream = new Writable({ write(chunk, _encoding, done) { chunks.push(chunk.toString()); done(); } });
  stream.text = () => chunks.join('');
  return stream;
};

describe('run: tool identification', () => {
  const cases = [
    // Flutter and Dart
    ['flutter test', 'compact', 'flutterTest'],
    ['flutter test --coverage test/login_test.dart', 'compact', 'flutterTest'],
    ['flutter analyze', 'compact', 'dartAnalyze'],
    ['flutter pub get', 'compact', 'pub'],
    ['flutter pub outdated', 'light'],
    ['flutter build apk --release', 'compact', 'gradle'],
    ['flutter build ipa', 'compact', 'xcode'],
    ['flutter run -d emulator-5554', 'stream'],
    ['flutter doctor -v', 'light'],
    ['flutter --version', 'light'],
    ['dart analyze', 'compact', 'dartAnalyze'],
    ['dart test', 'compact', 'flutterTest'],
    ['dart run build_runner build --delete-conflicting-outputs', 'compact', 'buildRunner'],
    ['flutter pub run build_runner build', 'compact', 'buildRunner'],
    ['fvm flutter test', 'compact', 'flutterTest'],
    ['fvm spawn 3.24.0 flutter build apk', 'compact', 'gradle'],
    ['melos run test', 'compact', 'flutterTest'],
    // Android and Kotlin Multiplatform
    ['./gradlew assembleDebug', 'compact', 'gradle'],
    ['./gradlew :app:testDebugUnitTest --continue', 'compact', 'gradle'],
    ['gradlew.bat lint', 'compact', 'gradle'],
    ['./gradlew :shared:iosSimulatorArm64Test', 'compact', 'xcode'],
    ['./gradlew :shared:linkDebugFrameworkIosArm64', 'compact', 'kotlin'],
    ['./gradlew allTests', 'compact', 'kotlin'],
    ['./gradlew :app:dependencies', 'light'],
    ['./gradlew tasks --all', 'light'],
    ['./gradlew --version', 'light'],
    ['adb install -r app-debug.apk', 'compact', 'adb'],
    ['adb devices', 'light'],
    ['adb logcat', 'stream'],
    ['ktlint --reporter=plain', 'compact', 'lintKotlin'],
    ['sdkmanager "platforms;android-35"', 'compact', 'sdkmanager'],
    // iOS
    ['xcodebuild -workspace App.xcworkspace -scheme App build', 'compact', 'xcode'],
    ['xcodebuild test -scheme App -destination "platform=iOS Simulator,name=iPhone 16"', 'compact', 'xcode'],
    ['xcodebuild -showBuildSettings -scheme App', 'light'],
    ['xcodebuild -list', 'light'],
    ['xcrun xcodebuild -scheme App archive', 'compact', 'xcode'],
    ['xcrun simctl list devices', 'light'],
    ['xcrun -sdk iphonesimulator swift build', 'compact', 'swift'],
    ['swift test', 'compact', 'swift'],
    ['swift package resolve', 'compact', 'swift'],
    ['pod install --repo-update', 'compact', 'cocoapods'],
    ['bundle exec pod install', 'compact', 'cocoapods'],
    ['pod outdated', 'light'],
    ['fastlane ios beta', 'compact', 'fastlane'],
    ['bundle exec fastlane android deploy', 'compact', 'gradle'],
    ['fastlane lanes', 'light'],
    ['swiftlint', 'compact', 'swiftLint'],
    // React Native and Expo
    ['npx react-native run-android', 'compact', 'gradle'],
    ['npx react-native run-ios --simulator "iPhone 16"', 'compact', 'xcode'],
    ['npx react-native start', 'stream'],
    ['npx expo run:ios', 'compact', 'xcode'],
    ['npx expo prebuild --clean', 'compact', 'expo'],
    ['npx expo start', 'stream'],
    ['eas build -p android', 'compact', 'eas'],
    ['eas build --local -p ios', 'compact', 'xcode'],
    ['npm install', 'compact', 'npm'],
    ['yarn', 'compact', 'npm'],
    ['pnpm add react-native-reanimated', 'compact', 'npm'],
    ['npm test', 'compact', 'jsTest'],
    ['yarn test --watchAll=false', 'compact', 'jsTest'],
    ['npm run lint', 'compact', 'eslint'],
    ['npm run typecheck', 'compact', 'ts'],
    ['npm run android', 'compact', 'gradle'],
    ['npm ls react-native', 'light'],
    ['npx jest --ci', 'compact', 'jsTest'],
    ['detox test -c ios.sim.debug', 'compact', 'jsTest'],
    ['maestro test flows/login.yaml', 'compact', 'maestro'],
    ['npx tsc --noEmit', 'compact', 'ts'],
    // Shell strings, wrappers and anything else
    ['cd ios && pod install', 'compact', 'cocoapods'],
    ['CI=true ./gradlew test', 'compact', 'gradle'],
    ['git status', 'light'],
    ['ls -la', 'light'],
  ];

  for (const [command, mode, family] of cases) {
    it(`${command} → ${mode}${family ? ` with ${family}` : ''}`, () => {
      const profile = identify([command]);
      assert.equal(profile.mode, mode);
      if (family) assert.ok(profile.families.includes(family), `${profile.families.join(', ')} includes ${family}`);
    });
  }

  it('identifies argv the same way as the shell string', () => {
    assert.deepEqual(identify(['flutter', 'test', '--coverage']), identify(['flutter test --coverage']));
  });

  it('filters adb logcat to warnings and errors only when no filterspec was given', () => {
    assert.equal(identify(['adb logcat']).streamFilter, 'logcatErrors');
    assert.equal(identify(['adb logcat *:E']).streamFilter, undefined);
    assert.equal(identify(['adb logcat -s MyApp']).streamFilter, undefined);
  });
});

describe('run: commands that keep running', () => {
  const endless = [
    'flutter run -d emulator-5554',
    'fvm flutter run --flavor dev',
    'flutter attach',
    'flutter logs',
    'emulator -avd Pixel_9',
    'adb logcat',
    'adb logcat *:E',
    'npx react-native start --port 8088',
    'npx expo start',
    'npx expo run:android',
    'npx expo run:ios --device "iPhone 16"',
    'xcrun simctl spawn booted log stream --level debug',
    'xcrun simctl launch --console booted com.example.app',
  ];
  const finite = [
    'flutter run --no-resident -d emulator-5554',
    'flutter test',
    'flutter build apk',
    'emulator -list-avds',
    'adb logcat -d',
    'adb logcat -t 100',
    'adb logcat -c',
    'npx react-native run-android',
    'npx react-native run-ios',
    'npx expo run:ios --no-bundler',
    'xcrun simctl bootstatus 1A2B -b',
    'xcrun simctl launch booted com.example.app',
    'npm start',
    'xcrun simctl spawn booted log show --last 5m',
    './gradlew assembleDebug',
  ];

  for (const command of endless) {
    it(`${command} does not end on its own`, () => assert.equal(identify([command]).endless, true));
  }
  for (const command of finite) {
    it(`${command} ends on its own`, () => assert.ok(!identify([command]).endless));
  }

  it('knows the readiness signal of flutter run, the emulator and the React Native dev server', () => {
    assert.equal(identify(['flutter run']).ready, READY.flutter);
    assert.ok(READY.flutter.test('Flutter run key commands.'));
    assert.ok(!READY.flutter.test('Flutter run key commands. extra'));
    assert.equal(identify(['emulator -avd Pixel_9']).ready, READY.emulator);
    assert.ok(READY.emulator.test('INFO         | Boot completed in 12345 ms'));
    const metro = identify(['npx react-native start --port=8088']);
    assert.equal(metro.readyUrl, 'http://localhost:8088/status');
    assert.equal(metro.readyBody, 'packager-status:running');
    assert.equal(identify(['react-native start']).readyUrl, 'http://localhost:8081/status');
    // expo run:* builds before it serves: no early "running" report.
    assert.equal(identify(['npx expo run:android']).settle, false);
  });

  it('formats durations for status lines', () => {
    assert.equal(duration(420), '0.4s');
    assert.equal(duration(12_400), '12s');
    assert.equal(duration(125_000), '2m05s');
    assert.equal(duration(3_780_000), '1h03m');
  });
});

describe('run: compact output on real tool output', () => {
  it('reduces a raw xcodebuild failure to the error, its snippet and the failed commands', () => {
    const { lines, text, stats } = compact('xcodebuild -workspace Runner.xcworkspace -scheme Runner build', fixture('xcodebuild-error'), 65);

    assert.ok(stats.rawBytes > 150_000);
    assert.ok(stats.shownBytes < stats.rawBytes / 100, `${stats.shownBytes} bytes shown`);
    assert.equal(lines.filter((line) => /AppDelegate\.swift:18:31: error: /.test(line)).length, 1, 'the arm64 and x86_64 copies collapse into one');
    assert.match(text, /18 \| func broken\(\) -> Int \{ return missingSymbol \}/);
    assert.match(text, /\*\* BUILD FAILED \*\*/);
    assert.match(text, /The following build commands failed:/);
    assert.match(text, /\(3 failures\)/);
    assert.doesNotMatch(text, /^ {4}(cd|export|builtin-)/m);
    assert.doesNotMatch(text, /SwiftExplicitDependencyGeneratePcm|Failed frontend command/);
  });

  it('keeps the Gradle failure, the Kotlin error and the warning headlines, not the task list', () => {
    const { text, stats } = compact('./gradlew assembleDebug', fixture('gradlew-error'));

    assert.match(text, /^> Task :app:compileDebugKotlin FAILED$/m);
    assert.match(text, /^e: file:\/\/\/.*MainActivity\.kt:7:21 Unresolved reference 'missingSymbol'\.$/m);
    assert.match(text, /^\* What went wrong:$/m);
    assert.match(text, /Execution failed for task ':app:compileDebugKotlin'/);
    assert.match(text, /^BUILD FAILED in 11s$/m);
    assert.match(text, /^WARNING: The option setting 'android.newDsl=false' is deprecated\.$/m);
    assert.doesNotMatch(text, /UP-TO-DATE|> Task :app:preBuild|Run with --stacktrace|It will be removed in version 10\.0/);
    assert.ok(stats.shownBytes < stats.rawBytes / 3);
  });

  it('keeps failing Flutter tests with their messages and only the final progress line', () => {
    const { text } = compact('flutter test', fixture('flutter-test-fail'));

    assert.match(text, /subtracts by mistake \[E\]/);
    assert.match(text, /Expected: <5>/);
    assert.match(text, /Null check operator used on a null value/);
    assert.match(text, /^Failing tests:$/m);
    assert.match(text, /^00:05 \+3 -2: Some tests failed\.$/m);
    assert.doesNotMatch(text, /: adds two numbers$|loading \//m);
  });

  it('prints only the summary when every Flutter test passes', () => {
    const { lines } = compact('flutter test', fixture('flutter-test-pass'), 0);
    assert.deepEqual(lines, ['00:01 +1: All tests passed!']);
  });

  it('keeps the Swift compiler error with its source snippet and drops the frontend command', () => {
    const { text, stats } = compact('swift build', fixture('swift-build-error'));

    assert.match(text, /FxKit\.swift:6:38: error: cannot find 'missingSymbol' in scope/);
    assert.match(text, /6 \| public func broken\(\) -> Int \{ return missingSymbol \}/);
    assert.match(text, /^error: Build failed$/m);
    assert.doesNotMatch(text, /swift-frontend -frontend|^\[\d+ \/ \d+\]/m);
    assert.ok(stats.shownBytes < stats.rawBytes / 5);
  });

  it('keeps the failing XCTest case and one test summary', () => {
    const { text } = compact('swift test', fixture('swift-test-fail'));

    assert.match(text, /error: -\[FxKitTests\.FxKitTests testFails\] : XCTAssertEqual failed/);
    assert.match(text, /Test Case '-\[FxKitTests\.FxKitTests testFails\]' failed/);
    assert.equal((text.match(/Executed 2 tests, with 1 failure/g) ?? []).length, 1);
    assert.doesNotMatch(text, /testPasses|Test Suite '.*' started/);
  });

  it('keeps the Flutter tool summary of Gradle and Xcode build failures', () => {
    const apk = compact('flutter build apk --debug', fixture('flutter-build-apk')).text;
    assert.match(apk, /^e: file:\/\/\/.*MainActivity\.kt:7:21/m);
    assert.match(apk, /^Gradle task assembleDebug failed with exit code 1$/m);
    assert.doesNotMatch(apk, /cupertino_icons 1\.0\.9|Run with --scan|Waiting for another flutter command/);

    const ios = compact('flutter build ios --simulator --debug', fixture('flutter-build-ios')).text;
    assert.match(ios, /^Swift Compiler Error \(Xcode\): Cannot find 'missingSymbol' in scope$/m);
    assert.match(ios, /AppDelegate\.swift:17:30$/m);
    assert.match(ios, /^Encountered error while building for simulator\.$/m);
  });

  it('keeps analyzer errors and the issue count', () => {
    for (const [command, name] of [['flutter analyze', 'flutter-analyze'], ['dart analyze', 'dart-analyze']]) {
      const { lines } = compact(command, fixture(name), command === 'dart analyze' ? 3 : 1);
      assert.equal(lines.length, 2, name);
      assert.match(lines[0], /error [•-] .*Undefined name 'undefinedName'/);
      assert.match(lines[1], /^1 issue found\./);
    }
  });

  it('keeps the whole pub version-solving explanation and its suggestion', () => {
    const { text } = compact('flutter pub get', fixture('flutter-pub-conflict'));
    assert.match(text, /^Because every version of flutter_localizations/m);
    assert.match(text, /version solving failed\./);
    assert.match(text, /^\* Try upgrading your constraint on intl: flutter pub add intl:\^0\.20\.3$/m);
    assert.doesNotMatch(text, /Resolving dependencies/);
  });

  it('keeps the CocoaPods error block', () => {
    const { text } = compact('pod install', fixture('pod-install-error'));
    assert.match(text, /^\[!\] Unable to find a specification for `DefinitelyMissingPodXYZ \(~> 9\.9\)`$/m);
    assert.match(text, /mistyped the name or version/);
    assert.doesNotMatch(text, /Analyzing dependencies/);
  });

  it('keeps the failing Jest test with its code frame and the summary, not passing tests', () => {
    const { text } = compact('npx jest', fixture('jest-fail'));
    assert.match(text, /^FAIL \.\/sum\.test\.js$/m);
    assert.match(text, /● sum › fails on purpose/);
    assert.match(text, /> 4 \| {3}test\('fails on purpose'/);
    assert.match(text, /^Tests: {7}1 failed, 2 passed, 3 total$/m);
    assert.doesNotMatch(text, /✓ adds/);
  });

  it('keeps the install summary and caps deprecation notices', () => {
    const many = Array.from({ length: 12 }, (_, i) => `npm warn deprecated pkg${i}@1.0.0: old`).join('\n');
    const { text, stats } = compact('npm install', `${many}\n${fixture('npm-install')}`, 0);
    assert.match(text, /^added 267 packages in 14s$/m);
    assert.ok(stats.hiddenInfos > 0);
  });
});

describe('run: compactor behavior', () => {
  it('prints the last lines when a command fails without a known error pattern', () => {
    const output = ['starting', 'doing work', 'the thing broke in an unusual way'].join('\n');
    const { text } = compact('gradle assemble', output, 2);
    assert.match(text, /no known error pattern matched/);
    assert.match(text, /the thing broke in an unusual way/);
  });

  it('prints nothing for a successful command without errors or summaries', () => {
    const { lines } = compact('pod install', 'Analyzing dependencies\nDownloading dependencies\n', 0);
    assert.deepEqual(lines, []);
  });

  it('removes progress, collapses repeats and blank runs in light mode', () => {
    const output = ['header', '[=====     ] 45%', '', '', '', 'same', 'same', 'same', 'end'].join('\n');
    const { lines } = compact('git status', output, 0);
    assert.deepEqual(lines, ['header', '', 'same', '  (previous line repeated 2×)', 'end']);
  });

  it('caps long stack traces inside an error block', () => {
    const frames = Array.from({ length: 10 }, (_, i) => `  package:app/src/f${i}.dart ${i + 1}:3  f${i}`).join('\n');
    const output = `00:01 +0 -1: crashes [E]\n  Bad state: boom\n${frames}\n00:02 +0 -1: Some tests failed.\n`;
    const { text } = compact('flutter test', output);
    assert.match(text, /f5\.dart/);
    assert.doesNotMatch(text, /f6\.dart/);
    assert.match(text, /… 4 more stack frames \(full log\)/);
  });

  it('truncates very long kept lines', () => {
    const { lines } = compact('swift build', `error: ${'x'.repeat(900)}\n`);
    assert.ok(lines[0].length < 600);
    assert.match(lines[0], /\(\+\d+ chars\)$/);
  });

  it('keeps only warnings and errors from an unfiltered logcat', () => {
    const output = [
      '11-17 09:26:10.840  1234  1250 D Choreographer: frame',
      '11-17 09:26:10.841  1234  1250 E AndroidRuntime: FATAL EXCEPTION: main',
      '\tat com.example.MainActivity.onCreate(MainActivity.kt:12)',
      '11-17 09:26:10.842  1234  1250 I ActivityManager: start',
    ].join('\n');
    const { lines } = compact('adb logcat', output, 0);
    assert.deepEqual(lines, [
      '11-17 09:26:10.841  1234  1250 E AndroidRuntime: FATAL EXCEPTION: main',
      '\tat com.example.MainActivity.onCreate(MainActivity.kt:12)',
    ]);
  });

  it('strips color codes and carriage-return progress', () => {
    assert.equal(cleanLine('\x1B[1;31merror:\x1B[0m bad'), 'error: bad');
    assert.equal(cleanLine('10%\r50%\rdone'), 'done');
  });
});

describe('run: runner', () => {
  const script = (code) => ['node', '-e', code];

  it('streams the compact output, saves the full log and returns the exit code', async () => {
    const logDir = await mkdtemp(join(tmpdir(), 'reis-run-'));
    const stdout = sink();
    const stderr = sink();
    const code = await runCommand(script("console.log('noise 1');console.error('lib/app.dart:3:5: Error: bad');console.log('noise 2');process.exit(3)"), {
      logDir, stdout, stderr, mode: 'compact',
    });

    assert.equal(code, 3);
    assert.match(stdout.text(), /lib\/app\.dart:3:5: Error: bad/);
    assert.doesNotMatch(stdout.text(), /noise 1/);
    assert.match(stderr.text(), /reis-mobile run: node · exit 3 · /);
    const [log] = await readdir(logDir);
    const saved = await readFile(join(logDir, log), 'utf8');
    assert.match(saved, /noise 1/);
    assert.match(saved, /Error: bad/);
    assert.match(saved, /noise 2/);
  });

  it('passes output through unchanged with --raw', async () => {
    const code = await runCommand(script('process.exit(0)'), { raw: true });
    assert.equal(code, 0);
  });

  it('returns 127 when the command does not exist', async () => {
    const stderr = sink();
    const code = await runCommand(['definitely-not-a-real-command-xyz'], { log: false, stdout: sink(), stderr });
    assert.equal(code, 127);
    assert.match(stderr.text(), /command not found/);
  });

  it('prints the result as JSON', async () => {
    const stdout = sink();
    await runCommand(script("console.log('Error: broken')"), { json: true, log: false, mode: 'compact', stdout, stderr: sink() });
    const result = JSON.parse(stdout.text());
    assert.equal(result.exitCode, 0);
    assert.deepEqual(result.output, ['Error: broken']);
    assert.equal(result.log, null);
  });

  it('runs a single string through the shell', async () => {
    const stdout = sink();
    const code = await runCommand(['echo one && echo two'], { log: false, stdout, stderr: sink() });
    assert.equal(code, 0);
    assert.match(stdout.text(), /one\ntwo/);
  });

  it('prints a progress line while the command is quiet, with its last output', async () => {
    const stderr = sink();
    const code = await runCommand(script("process.stdout.write('Running Gradle task');setTimeout(()=>console.log(' done'),700)"), {
      log: false, stdout: sink(), stderr, heartbeat: 0.15, mode: 'compact',
    });
    assert.equal(code, 0);
    assert.match(stderr.text(), /\[reis-mobile run: node · running [\d.]+s · last output [\d.]+s ago: Running Gradle task\]/);
    assert.match(stderr.text(), /exit 0 · [\d.]+s · /);
  });

  it('says so when a quiet command printed nothing yet, and stays silent with --heartbeat 0', async () => {
    const quiet = script('setTimeout(()=>{},500)');
    const loud = sink();
    await runCommand(quiet, { log: false, stdout: sink(), stderr: loud, heartbeat: 0.15 });
    assert.match(loud.text(), /running [\d.]+s · no output yet/);

    const off = sink();
    await runCommand(quiet, { log: false, stdout: sink(), stderr: off, heartbeat: 0 });
    assert.doesNotMatch(off.text(), /running [\d.]+s/);
  });

  it('reports readiness once and writes the ready and exit lines to the log', async () => {
    const logDir = await mkdtemp(join(tmpdir(), 'reis-run-'));
    const stderr = sink();
    await runCommand(script("console.log('Server READY');console.log('Server READY')"), { logDir, stdout: sink(), stderr, ready: /READY/ });
    assert.equal(stderr.text().match(/ready after/g).length, 1);
    assert.match(stderr.text(), /ready after [\d.]+s · signal: Server READY/);
    const [log] = await readdir(logDir);
    const saved = await readFile(join(logDir, log), 'utf8');
    assert.match(saved, /^\[reis-mobile run: node · ready after [\d.]+s/m);
    assert.match(saved, /^\[reis-mobile run: node · exit 0 · [\d.]+s\]$/m);
  });

  it('warns that a command which never ends blocks the caller', async () => {
    const stderr = sink();
    // An empty PATH makes sure no real emulator starts; the warning comes before the spawn.
    const code = await runCommand(['emulator', '-avd', 'Pixel_9'], { log: false, stdout: sink(), stderr, env: { PATH: '' } });
    assert.equal(code, 127);
    assert.match(stderr.text(), /emulator · keeps running until stopped · .*--background/);
  });
});

describe('run: arguments', () => {
  it('reads options until -- and keeps the command untouched', () => {
    const { options, command } = parseRunArgs(['--max-lines', '40', '--no-log', '--', 'flutter', 'test', '-v', '--json']);
    assert.deepEqual(options, { maxLines: '40', noLog: true });
    assert.deepEqual(command, ['flutter', 'test', '-v', '--json']);
  });

  it('stops at the first word that is not a run option', () => {
    const { options, command } = parseRunArgs(['--mode=light', 'xcodebuild', '-list']);
    assert.deepEqual(options, { mode: 'light' });
    assert.deepEqual(command, ['xcodebuild', '-list']);
  });

  it('reads the background, follow and readiness options', () => {
    assert.deepEqual(parseRunArgs(['--background', '--wait', '30', '--ready-url=http://localhost:8081', '--', 'npx', 'expo', 'start']), {
      options: { background: true, wait: '30', readyUrl: 'http://localhost:8081' },
      command: ['npx', 'expo', 'start'],
    });
    assert.deepEqual(parseRunArgs(['--follow', '/tmp/x.log', '--heartbeat', '0']), { options: { follow: '/tmp/x.log', heartbeat: '0' }, command: [] });
  });
});

describe('run: Claude Code hook', () => {
  const prefix = 'RUN --';

  it('routes recognized mobile commands and leaves the rest of the line alone', () => {
    assert.equal(rewriteCommand('flutter test', { prefix }), 'RUN -- flutter test');
    assert.equal(rewriteCommand('cd ios && pod install', { prefix }), 'cd ios && RUN -- pod install');
    assert.equal(rewriteCommand('CI=true ./gradlew test; echo done', { prefix }), 'CI=true RUN -- ./gradlew test; echo done');
    assert.equal(rewriteCommand('npx expo prebuild --clean', { prefix }), 'RUN -- npx expo prebuild --clean');
  });

  it('leaves commands it could break or does not recognize unchanged', () => {
    for (const command of [
      'git status',
      'flutter test | tee out.txt',
      './gradlew build > build.log',
      'echo $(flutter --version)',
      'flutter test &',
      'reis-mobile run -- flutter test',
      'node "/x/bin/reis-mobile.mjs" run -- pod install',
      'rtk gradlew build',
    ]) {
      assert.equal(rewriteCommand(command, { prefix }), null, command);
    }
  });

  it('splits on top-level operators only', () => {
    assert.deepEqual(splitCommandLine('a && b || c; d'), [[0, 2], [4, 7], [9, 11], [12, 14]]);
    assert.deepEqual(splitCommandLine('echo "a && b"'), [[0, 13]]);
    assert.equal(splitCommandLine('a | b'), null);
  });

  it('returns the Claude Code hook output only when enabled', () => {
    const input = { tool_name: 'Bash', tool_input: { command: 'flutter test', description: 'Run tests' } };
    const env = { PATH: '' };

    assert.equal(handlePreToolUse(input, { enabled: false, env, prefix }), null);
    assert.equal(handlePreToolUse({ ...input, tool_name: 'Read' }, { enabled: true, env, prefix }), null);
    assert.deepEqual(handlePreToolUse(input, { enabled: true, env, prefix }), {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecisionReason: 'reis-mobile run: compact output for a mobile build or test command',
        updatedInput: { command: 'RUN -- flutter test', description: 'Run tests' },
      },
    });
  });

  it('starts never-ending commands with --background when the guard is on', () => {
    const background = 'BG --';
    const plan = (command, options) => planRewrite(command, { prefix, background, ...options });

    assert.deepEqual(plan('flutter run -d emulator-5554', { compact: false, guard: true }), {
      command: 'BG -- flutter run -d emulator-5554', compacted: [], guarded: ['flutter run'],
    });
    assert.equal(plan('flutter pub get && flutter run', { guard: true }).command, 'RUN -- flutter pub get && BG -- flutter run');
    assert.equal(plan('cd android && adb logcat *:E', { compact: false, guard: true }).command, 'cd android && BG -- adb logcat *:E');
    assert.equal(plan('flutter run --no-resident', { compact: false, guard: true }), null);
    assert.equal(plan('flutter test', { compact: false, guard: true }), null);
    // Without the guard a never-ending command keeps the plain runner, as before.
    assert.equal(plan('flutter run', { guard: false }).command, 'RUN -- flutter run');
  });

  it('guards by default, but not a call that already runs in the background', () => {
    const env = { PATH: '' };
    const background = 'BG --';
    const input = { tool_name: 'Bash', tool_input: { command: 'flutter run -d emulator-5554', description: 'Launch the app' } };

    const output = handlePreToolUse(input, { enabled: false, guard: true, env, prefix, background });
    assert.equal(output.hookSpecificOutput.updatedInput.command, 'BG -- flutter run -d emulator-5554');
    assert.match(output.hookSpecificOutput.permissionDecisionReason, /flutter run does not end on its own/);

    const detached = { ...input, tool_input: { ...input.tool_input, run_in_background: true } };
    assert.equal(handlePreToolUse(detached, { enabled: false, guard: true, env, prefix, background }), null);
    assert.equal(handlePreToolUse({ ...input, tool_input: { command: 'flutter test' } }, { enabled: false, guard: true, env, prefix, background }), null);
    assert.equal(handlePreToolUse(input, { enabled: false, guard: false, env, prefix, background }), null);
  });

  it('keeps the guard on unless it was turned off', async () => {
    const path = join(await mkdtemp(join(tmpdir(), 'reis-hook-')), 'config.json');
    assert.deepEqual(await readRunSettings(path), { hook: false, guard: true });
    await setRunGuard(false, path);
    assert.deepEqual(await readRunSettings(path), { hook: false, guard: false });
    await setRunHook(true, path);
    assert.deepEqual(await readRunSettings(path), { hook: true, guard: false });
  });

  it('stores the hook setting next to the language setting', async () => {
    const path = join(await mkdtemp(join(tmpdir(), 'reis-hook-')), 'config.json');
    assert.equal(await isRunHookEnabled(path), false);
    await setRunHook(true, path);
    assert.equal(await isRunHookEnabled(path), true);
    await setRunHook(false, path);
    assert.equal(await isRunHookEnabled(path), false);
  });
});
