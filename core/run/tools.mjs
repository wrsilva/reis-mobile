/**
 * Recognizes the mobile tool behind a command line and picks how `reis-mobile run` filters it.
 *
 * Modes:
 *   compact  builds, tests, analyzers, installs: keep errors, failures, warnings and summaries
 *   light    queries whose output is the answer (doctor, devices, dependencies, settings):
 *            keep everything except progress noise and repeats
 *   stream   commands that keep running (flutter run, Metro, logcat): print as lines arrive
 *
 * Any command works: an unrecognized tool runs in light mode.
 */

const WRAPPERS_WITH_FLAGS = new Set(['env', 'time', 'command', 'exec', 'nice', 'nohup', 'caffeinate', 'arch', 'sudo']);
const NPX_VALUE_FLAGS = new Set(['-p', '--package', '-c', '--call']);
const XCRUN_VALUE_FLAGS = new Set(['-sdk', '--sdk', '-toolchain', '--toolchain']);

const GRADLE_QUERY_TASKS = new Set([
  'tasks', 'dependencies', 'dependencyinsight', 'properties', 'projects', 'help', 'buildenvironment',
  'outgoingvariants', 'resolvableconfigurations', 'javatoolchains', 'model', 'signingreport',
  'androiddependencies', 'sourcesets', 'kotlindslaccessorsreport',
]);
const GRADLE_QUERY_FLAGS = new Set(['--version', '-v', '--help', '-h', '-?', '--status', '--stop', '--dry-run', '-m']);
const XCODEBUILD_QUERY_FLAGS = new Set([
  '-list', '-showbuildsettings', '-showsdks', '-version', '-showdestinations', '-showtestplans', '-help',
  '-usage', '-checkfirstlaunchstatus', '-showcomponent', '-runfirstlaunch',
]);
const PACKAGE_MANAGERS = new Set(['npm', 'yarn', 'pnpm', 'bun']);
const PM_INSTALL = new Set(['install', 'i', 'ci', 'add', 'remove', 'rm', 'uninstall', 'un', 'update', 'up', 'upgrade', 'rebuild', 'dedupe', 'prune', 'link']);
const PM_TEST = new Set(['test', 't', 'tst']);
const PM_LIGHT = new Set([
  'outdated', 'ls', 'list', 'why', 'view', 'info', 'show', 'audit', 'config', 'get', 'set', 'whoami',
  'version', 'help', 'search', 'explain', 'root', 'bin', 'prefix', 'pack', 'publish', 'init', 'create',
]);

const ANDROID_GRADLE = ['gradle', 'kotlin', 'common'];
const IOS_XCODE = ['xcode', 'swift', 'cocoapods', 'common'];

const profile = (tool, mode, families, extra = {}) => ({ tool, mode, families, ...extra });
const light = (tool) => profile(tool, 'light', ['common']);
const stream = (tool, families = ['common'], extra = {}) => profile(tool, 'stream', families, extra);

/** Splits a shell command line into words, honoring quotes. Operators are separate words. */
export function shellWords(command) {
  const words = [];
  let current = '';
  let quote = null;
  let started = false;
  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    if (quote) {
      if (char === quote) quote = null;
      else if (char === '\\' && quote === '"' && i + 1 < command.length) current += command[++i];
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") { quote = char; started = true; continue; }
    if (char === '\\' && i + 1 < command.length) { current += command[++i]; started = true; continue; }
    if (/\s/.test(char)) {
      if (started) words.push(current);
      current = '';
      started = false;
      continue;
    }
    const two = command.slice(i, i + 2);
    if (two === '&&' || two === '||') {
      if (started) words.push(current);
      words.push(two);
      current = '';
      started = false;
      i++;
      continue;
    }
    if (char === ';' || char === '|' || char === '&') {
      if (started) words.push(current);
      words.push(char);
      current = '';
      started = false;
      continue;
    }
    current += char;
    started = true;
  }
  if (started) words.push(current);
  return words;
}

const OPERATORS = new Set(['&&', '||', ';', '|', '&']);

/** Splits shell words into the simple commands between operators. */
export function segments(words) {
  const result = [[]];
  for (const word of words) {
    if (OPERATORS.has(word)) result.push([]);
    else result.at(-1).push(word);
  }
  return result.filter((segment) => segment.length);
}

const base = (word) => word.split(/[\\/]/).pop().toLowerCase().replace(/\.(bat|cmd|exe|sh|ps1)$/, '');

/** Removes env assignments and wrappers such as fvm, npx, xcrun and bundle exec. */
export function unwrap(words) {
  let i = 0;
  while (i < words.length) {
    const word = words[i];
    const name = base(word);
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(word)) { i++; continue; }
    if (WRAPPERS_WITH_FLAGS.has(name)) {
      i++;
      while (i < words.length && (words[i].startsWith('-') || /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i]))) i++;
      continue;
    }
    if (name === 'fvm' && ['flutter', 'dart'].includes(base(words[i + 1] ?? ''))) { i++; continue; }
    if (name === 'fvm' && words[i + 1] === 'spawn') { i += 3; continue; }
    if (name === 'npx' || name === 'bunx') {
      i++;
      while (i < words.length && words[i].startsWith('-')) i += NPX_VALUE_FLAGS.has(words[i]) ? 2 : 1;
      continue;
    }
    if ((name === 'pnpm' && ['exec', 'dlx'].includes(words[i + 1])) || (name === 'yarn' && ['exec', 'dlx'].includes(words[i + 1]))) { i += 2; continue; }
    if (name === 'bundle' && words[i + 1] === 'exec') { i += 2; continue; }
    if (name === 'xcrun') {
      i++;
      while (i < words.length && words[i].startsWith('-')) i += XCRUN_VALUE_FLAGS.has(words[i]) ? 2 : 1;
      continue;
    }
    break;
  }
  return words.slice(i);
}

const firstPositional = (args) => args.find((arg) => !arg.startsWith('-'));
const positionals = (args) => args.filter((arg) => !arg.startsWith('-'));
const has = (args, ...flags) => args.some((arg) => flags.includes(arg.toLowerCase().split('=')[0]));

function flutterProfile(tool, args) {
  const sub = firstPositional(args);
  const label = `${tool}${sub ? ` ${sub}` : ''}`;
  if (has(args, '--version', '-h', '--help')) return light(label);
  switch (sub) {
    case 'test':
      return profile(label, 'compact', ['flutterTest', 'dart', 'flutter', 'common']);
    case 'analyze':
      return profile(label, 'compact', ['dartAnalyze', 'common']);
    case 'pub':
    case 'packages':
      return pubProfile(label, args.slice(args.indexOf(sub) + 1));
    case 'build':
    case 'install':
    case 'drive':
    case 'gen-l10n':
    case 'create':
    case 'clean':
    case 'precache':
    case 'upgrade':
    case 'downgrade':
    case 'bundle':
    case 'assemble':
    case 'compile':
      return profile(label, 'compact', ['flutter', 'dart', 'pub', 'gradle', 'kotlin', 'xcode', 'cocoapods', 'common']);
    case 'run':
      if (tool === 'dart') return dartRunProfile(label, args);
      return stream(label, ['common']);
    case 'attach':
    case 'logs':
      return stream(label, ['common']);
    case 'format':
    case 'fix':
      return light(label);
    default:
      return light(label);
  }
}

function pubProfile(label, args) {
  const sub = firstPositional(args);
  const name = `${label}${sub ? ` ${sub}` : ''}`;
  if (args.some((arg) => arg.includes('build_runner'))) return profile(`${name} build_runner`, 'compact', ['buildRunner', 'dart', 'common']);
  if (['get', 'upgrade', 'downgrade', 'add', 'remove', 'cache', 'global'].includes(sub) && !(sub === 'global' && ['list', 'run'].includes(positionals(args)[1]))) {
    return profile(name, 'compact', ['pub', 'common']);
  }
  return light(name);
}

function dartRunProfile(label, args) {
  if (args.some((arg) => arg.includes('build_runner'))) return profile(`${label} build_runner`, 'compact', ['buildRunner', 'dart', 'common']);
  return stream(label, ['common']);
}

function gradleProfile(tool, args) {
  const tasks = positionals(args).map((task) => task.split(':').pop().toLowerCase());
  const label = `${tool}${tasks.length ? ` ${positionals(args).join(' ')}` : ''}`;
  if (has(args, ...GRADLE_QUERY_FLAGS) || (tasks.length && tasks.every((task) => GRADLE_QUERY_TASKS.has(task)))) return light(label);
  const apple = tasks.some((task) => /ios|xcframework|framework|pod|apple|macos|watchos|tvos|xcode/.test(task));
  return profile(label, 'compact', apple ? ['gradle', 'kotlin', 'cocoapods', 'xcode', 'common'] : ANDROID_GRADLE);
}

function adbProfile(args) {
  const sub = firstPositional(args);
  const label = `adb${sub ? ` ${sub}` : ''}`;
  if (['install', 'install-multiple', 'install-multi-package', 'uninstall', 'push', 'pull', 'sideload'].includes(sub)) {
    return profile(label, 'compact', ['adb', 'common']);
  }
  if (sub === 'logcat') {
    const rest = args.slice(args.indexOf('logcat') + 1);
    const filtered = rest.some((arg) => /^[\w*]+:[VDIWEFS*]$/.test(arg) || ['-s', '--pid', '-e', '--regex', '-d', '-c'].includes(arg));
    return filtered ? stream(label) : stream(label, ['common'], { streamFilter: 'logcatErrors' });
  }
  return light(label);
}

function xcodebuildProfile(tool, args) {
  const label = [tool, ...args.filter((arg) => /^(build|test|archive|clean|analyze|test-without-building|build-for-testing|docbuild|-exportArchive)$/i.test(arg))].join(' ');
  if (has(args, ...XCODEBUILD_QUERY_FLAGS)) return light(label);
  return profile(label, 'compact', IOS_XCODE);
}

function swiftProfile(args) {
  const sub = firstPositional(args);
  const label = `swift${sub ? ` ${sub}` : ''}`;
  if (has(args, '--version', '-version', '--help', '-h')) return light(label);
  if (['build', 'test', 'run'].includes(sub)) return profile(label, sub === 'run' ? 'stream' : 'compact', ['xcode', 'swift', 'common']);
  if (sub === 'package' && ['resolve', 'update', 'reset', 'clean', 'purge-cache'].includes(positionals(args)[1])) {
    return profile(`${label} ${positionals(args)[1]}`, 'compact', ['swift', 'common']);
  }
  return light(label);
}

function podProfile(args) {
  const sub = firstPositional(args);
  const label = `pod${sub ? ` ${sub}` : ''}`;
  if (['install', 'update', 'deintegrate', 'lib', 'spec', 'repo', 'trunk'].includes(sub) && !['cat', 'which', 'list'].includes(positionals(args)[1])) {
    return profile(label, 'compact', ['cocoapods', 'xcode', 'common']);
  }
  return light(label);
}

function reactNativeProfile(args) {
  const sub = firstPositional(args);
  const label = `react-native${sub ? ` ${sub}` : ''}`;
  if (['run-android', 'build-android'].includes(sub)) return profile(label, 'compact', ['rnCli', 'metro', ...ANDROID_GRADLE]);
  if (['run-ios', 'build-ios'].includes(sub)) return profile(label, 'compact', ['rnCli', 'metro', ...IOS_XCODE]);
  if (sub === 'start') return stream(label, ['metro', 'common']);
  if (sub === 'bundle' || sub === 'ram-bundle') return profile(label, 'compact', ['metro', 'common']);
  if (sub === 'log-android' || sub === 'log-ios') return stream(label);
  return light(label);
}

function expoProfile(args) {
  const sub = firstPositional(args);
  const label = `expo${sub ? ` ${sub}` : ''}`;
  if (sub === 'start' || sub === undefined) return stream(label, ['metro', 'expo', 'common']);
  if (sub === 'run:android') return profile(label, 'compact', ['expo', 'metro', ...ANDROID_GRADLE]);
  if (sub === 'run:ios') return profile(label, 'compact', ['expo', 'metro', ...IOS_XCODE]);
  if (sub === 'prebuild') return profile(label, 'compact', ['expo', 'cocoapods', 'common']);
  if (sub?.startsWith('export')) return profile(label, 'compact', ['expo', 'metro', 'common']);
  if (sub === 'install') return profile(label, 'compact', ['expo', 'npm', 'common']);
  if (sub === 'lint') return profile(label, 'compact', ['eslint', 'common']);
  return light(label);
}

function easProfile(args) {
  const sub = firstPositional(args);
  const label = `eas${sub ? ` ${sub}` : ''}`;
  if (/^(build|submit|update|workflow:run|deploy)$/.test(sub ?? '')) {
    const local = has(args, '--local');
    return profile(label, 'compact', local ? ['eas', 'expo', 'metro', 'gradle', 'kotlin', 'xcode', 'cocoapods', 'common'] : ['eas', 'common']);
  }
  return light(label);
}

function packageManagerProfile(tool, args) {
  const sub = firstPositional(args);
  const label = `${tool}${sub ? ` ${sub}` : ''}`;
  if (has(args, '--version', '-v', '--help', '-h')) return light(label);
  if (sub === undefined && tool === 'yarn') return profile(label, 'compact', ['npm', 'common']);
  if (PM_INSTALL.has(sub)) return profile(label, 'compact', ['npm', 'common']);
  if (PM_TEST.has(sub)) return profile(label, 'compact', ['jsTest', 'common']);
  if (PM_LIGHT.has(sub)) return light(label);
  const script = sub === 'run' || sub === 'run-script' ? positionals(args)[1] ?? '' : sub ?? '';
  return scriptProfile(`${label}${sub === 'run' && script ? ` ${script}` : ''}`, script);
}

function scriptProfile(label, script) {
  if (/e2e|detox/i.test(script)) return profile(label, 'compact', ['jsTest', 'metro', 'common']);
  if (/test|jest/i.test(script)) return profile(label, 'compact', ['jsTest', 'common']);
  if (/lint|eslint/i.test(script)) return profile(label, 'compact', ['eslint', 'common']);
  if (/tsc|typecheck|types/i.test(script)) return profile(label, 'compact', ['ts', 'common']);
  if (/android/i.test(script)) return profile(label, 'compact', ['rnCli', 'expo', 'metro', ...ANDROID_GRADLE]);
  if (/ios/i.test(script)) return profile(label, 'compact', ['rnCli', 'expo', 'metro', ...IOS_XCODE]);
  if (/^(start|dev|serve)$/i.test(script)) return stream(label, ['metro', 'expo', 'common']);
  if (/build|bundle|export|prebuild/i.test(script)) return profile(label, 'compact', ['expo', 'metro', 'common']);
  return light(label);
}

const SIMPLE = {
  kotlinc: (args) => profile('kotlinc', 'compact', ['kotlin', 'common']),
  'kotlinc-native': () => profile('kotlinc-native', 'compact', ['kotlin', 'common']),
  konanc: () => profile('konanc', 'compact', ['kotlin', 'common']),
  ktlint: () => profile('ktlint', 'compact', ['lintKotlin', 'common']),
  detekt: () => profile('detekt', 'compact', ['lintKotlin', 'common']),
  'detekt-cli': () => profile('detekt', 'compact', ['lintKotlin', 'common']),
  lint: () => profile('lint', 'compact', ['androidLint', 'common']),
  sdkmanager: (args) => (has(args, '--list', '--list_installed', '--version') ? light('sdkmanager') : profile('sdkmanager', 'compact', ['sdkmanager', 'common'])),
  avdmanager: (args) => (firstPositional(args) === 'list' ? light('avdmanager list') : profile(`avdmanager ${firstPositional(args) ?? ''}`.trim(), 'compact', ['sdkmanager', 'common'])),
  emulator: (args) => (has(args, '-list-avds', '-help', '-version') ? light('emulator') : stream('emulator')),
  swiftc: () => profile('swiftc', 'compact', ['xcode', 'common']),
  swiftlint: (args) => (['version', 'rules', 'help'].includes(firstPositional(args)) ? light('swiftlint') : profile('swiftlint', 'compact', ['xcode', 'swiftLint', 'common'])),
  carthage: (args) => profile(`carthage ${firstPositional(args) ?? ''}`.trim(), ['build', 'bootstrap', 'update'].includes(firstPositional(args)) ? 'compact' : 'light', ['xcode', 'common']),
  tuist: (args) => (['build', 'test', 'generate', 'install', 'fetch'].includes(firstPositional(args)) ? profile(`tuist ${firstPositional(args)}`, 'compact', IOS_XCODE) : light('tuist')),
  fastlane: (args) => (['lanes', 'list', 'env', 'action', 'actions', 'docs', 'search_plugins', 'help'].includes(firstPositional(args)) || has(args, '--version', '-v', '--help')
    ? light('fastlane')
    : profile(`fastlane ${positionals(args).join(' ')}`.trim(), 'compact', ['fastlane', 'xcode', 'gradle', 'kotlin', 'cocoapods', 'common'])),
  'react-native': reactNativeProfile,
  rnc: reactNativeProfile,
  expo: expoProfile,
  eas: easProfile,
  metro: () => stream('metro', ['metro', 'common']),
  jest: (args) => (has(args, '--listtests', '--showconfig', '--version') ? light('jest') : profile('jest', 'compact', ['jsTest', 'common'])),
  detox: (args) => (firstPositional(args) === 'build'
    ? profile('detox build', 'compact', ['gradle', 'kotlin', 'xcode', 'common'])
    : firstPositional(args) === 'test' ? profile('detox test', 'compact', ['jsTest', 'common']) : light('detox')),
  maestro: (args) => (['test', 'cloud', 'record'].includes(firstPositional(args)) ? profile(`maestro ${firstPositional(args)}`, 'compact', ['maestro', 'common']) : light('maestro')),
  tsc: (args) => (has(args, '--version', '--help', '--showconfig') ? light('tsc') : profile('tsc', 'compact', ['ts', 'common'])),
  eslint: () => profile('eslint', 'compact', ['eslint', 'common']),
  melos: (args) => (['bootstrap', 'bs', 'clean', 'run', 'exec', 'test', 'analyze', 'build'].includes(firstPositional(args))
    ? profile(`melos ${positionals(args).join(' ')}`.trim(), 'compact', ['flutterTest', 'dartAnalyze', 'dart', 'pub', 'common'])
    : light('melos')),
  very_good: (args) => (firstPositional(args) === 'test' ? profile('very_good test', 'compact', ['flutterTest', 'dart', 'common']) : light('very_good')),
};

/**
 * Identifies the tool for argv (already split) or a single shell command string.
 * Returns { tool, mode, families, streamFilter? }.
 */
export function identify(argv) {
  const words = argv.length === 1 ? shellWords(argv[0]) : argv;
  const parts = segments(words).map(unwrap).filter((part) => part.length);
  for (const part of parts) {
    const result = identifyOne(part);
    if (result) return result;
  }
  const first = parts[0] ?? [];
  return light(first.length ? base(first[0]) : 'command');
}

/** The profile for one simple command when its tool is recognized, else null. */
export function recognize(words) {
  const part = unwrap(words);
  return part.length ? identifyOne(part) : null;
}

function identifyOne([exe, ...args]) {
  const tool = base(exe);
  if (tool === 'flutter' || tool === 'dart') return flutterProfile(tool, args);
  if (tool === 'gradle' || tool === 'gradlew') return gradleProfile(tool === 'gradlew' ? 'gradlew' : 'gradle', args);
  if (tool === 'adb') return adbProfile(args);
  if (tool === 'xcodebuild') return xcodebuildProfile(tool, args);
  if (tool === 'swift') return swiftProfile(args);
  if (tool === 'pod') return podProfile(args);
  if (PACKAGE_MANAGERS.has(tool)) return packageManagerProfile(tool, args);
  if (tool === 'simctl' || tool === 'xcresulttool' || tool === 'altool' || tool === 'notarytool' || tool === 'xctrace' || tool === 'devicectl') {
    const sub = firstPositional(args);
    const label = `${tool}${sub ? ` ${sub}` : ''}`;
    if (tool === 'simctl' && sub === 'spawn' && args.includes('log')) return stream(label);
    return light(label);
  }
  if (SIMPLE[tool]) return SIMPLE[tool](args);
  return null;
}

/** Tools that `identify` handles specially; anything else runs in light mode. */
export const KNOWN_TOOLS = [
  'flutter', 'dart', 'fvm', 'melos', 'very_good', 'gradle', 'gradlew', 'kotlinc', 'kotlinc-native', 'konanc',
  'ktlint', 'detekt', 'lint', 'adb', 'sdkmanager', 'avdmanager', 'emulator', 'xcodebuild', 'xcrun', 'simctl',
  'xcresulttool', 'altool', 'notarytool', 'xctrace', 'devicectl', 'swift', 'swiftc', 'swiftlint', 'pod', 'carthage',
  'tuist', 'fastlane', 'react-native', 'expo', 'eas', 'metro', 'jest', 'detox', 'maestro', 'npm', 'yarn', 'pnpm',
  'bun', 'npx', 'tsc', 'eslint',
];
