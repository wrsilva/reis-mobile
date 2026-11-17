/**
 * Line rules for `reis-mobile run`. A tool profile combines several families; in compact
 * mode a line survives only when a rule claims it, so every rule below names something an
 * agent needs: an error, a failed test, a warning headline or the final summary.
 *
 * Rule kinds, checked per family in this order:
 *   never    dropped even inside a block (command-line plumbing, giant compiler invocations)
 *   error    kept, counted as a failure signal; may open a context block
 *   warn     kept up to the warning cap, then counted
 *   info     kept up to the info cap, then counted
 *   keep     kept (status worth showing, not a failure)
 *   summary  only the last line matching each rule is kept, printed at the end
 *
 * A block keeps the lines after its start line: `until` ends it (`inclusive` keeps the end
 * line), `cont` ends it at the first line that does not match, `max` bounds it and
 * `blank: 'keep'` lets it run across blank lines. Patterns were checked against real output
 * captured in tests/fixtures/run.
 */

const block = (options) => ({ max: 12, ...options });

const PROGRESS = [
  /^\s*[[(|]?[=#>\-.\s█░▒▓■□]*[\])|]?\s*\d{1,3}(\.\d+)?\s?%(\s.*)?$/u,
  /^\s*[\u2800-\u28FF]/u,
  /^\s*[|/\\-]\s*$/,
];

export const NOISE = PROGRESS;

export const FAMILIES = {
  common: {
    never: PROGRESS,
    error: [
      /(^|[\s([])(error|fatal error|fatal)(\[[^\]]*\])?:/i,
      /^\s*(error|ERROR)\b[\s:•-]/,
      /\b(FAILED|FAILURE|FATAL)\b/,
      /\bfailed\b/i,
      /\b(Exception|Unhandled exception)\b/,
      /\bcommand not found\b|No such file or directory/,
    ],
    warn: [
      /(^|[\s([])warning(\[[^\]]*\])?:/i,
      /^\s*(warning|WARNING|warn|WARN)\b[\s:•-]/,
    ],
  },

  // flutter test / dart test (expanded reporter, used when stdout is not a terminal)
  flutterTest: {
    error: [
      { re: /^\d{2}:\d{2} \+\d+.*\[E\]$/, block: block({ until: /^\d{2}:\d{2} \+\d+/, max: 30, blank: 'keep' }) },
      { re: /^Failing tests:$/, block: block({ cont: /^\s+\S/, max: 60 }) },
      /^══╡ EXCEPTION CAUGHT BY/,
    ],
    summary: [/^\d{2}:\d{2} \+\d+/],
  },

  // flutter analyze / dart analyze
  dartAnalyze: {
    never: [/^Analyzing /],
    error: [/^\s*error [•-] /],
    warn: [/^\s*warning [•-] /],
    info: [/^\s*info [•-] /],
    summary: [/^\d+ issues? found/, /^No issues found!/],
  },

  // Dart compiler messages from flutter build/run and dart compile/run
  dart: {
    error: [
      { re: /^\S+\.dart:\d+:\d+: Error: /, block: block({ max: 4 }) },
      { re: /^Unhandled exception:/, block: block({ max: 12 }) },
    ],
    warn: [/^\S+\.dart:\d+:\d+: Warning: /],
  },

  // dart pub / flutter pub
  pub: {
    never: [/^Resolving dependencies/, /^Downloading packages/, /^ {2}\S+ \S+ \(\S+ available\)$/, /^[<>+*!-] [\w-]+ \d\S*( |$)/,/^Try `(flutter|dart) pub outdated`/],
    error: [
      /^Because /,
      /^(So|And), because /,
      /version solving failed/,
      /^Failed to update packages/,
      /^Could not find a file named "pubspec\.yaml"/,
    ],
    keep: [/^You can try the following suggestion/, /^\* Try /],
    summary: [/^Got dependencies!/, /^Changed \d+ dependenc/, /^No dependencies changed/, /^\d+ packages? (has|have) newer versions/],
  },

  // The flutter tool's own messages around Gradle and Xcode
  flutter: {
    never: [/^Waiting for another flutter command/, /^Running (Gradle task|Xcode build|pod install)/, /^Swift Package Manager is currently disabled/],
    error: [
      /^Failed to build /,
      { re: /Error \((Xcode|Gradle)\): |Compiler Error \(Xcode\): /, block: block({ max: 2 }) },
      /^Encountered error while (building|archiving)/,
      /^Gradle task \S+ failed/,
      /^Could not build the (precompiled )?application/,
      /^Lost connection to device/,
      /^Error launching application/,
      /^No supported devices (found|connected)/,
    ],
    keep: [/^A Dart VM Service on .* is available at/, /^Launching lib\//],
    summary: [/^[✓√] Built /, /^Xcode build done\./, /^Running Gradle task .*\d+(\.\d+)?s$/],
  },

  // Gradle, including Android and Kotlin Multiplatform builds
  gradle: {
    error: [
      /^> Task \S+ FAILED$/,
      /^FAILURE: /,
      { re: /^\* What went wrong:/, block: block({ until: /^\* (Try|Exception is|Get more help):/, max: 40, blank: 'keep' }) },
      { re: /^\S.* > .* FAILED$/, block: block({ cont: /^\s+\S/, max: 10 }) },
      /^\d+ tests? completed, \d+ failed/,
      { re: /^There were failing tests/, block: block({ max: 1 }) },
      /^Lint found \d+ errors?/,
      /^\d+ problems? (was|were) found/,
    ],
    warn: [/^WARNING: /],
    summary: [/^BUILD (SUCCESSFUL|FAILED) in /, /^\d+ actionable tasks?:/],
  },

  // Kotlin compiler (JVM, Android and Kotlin/Native)
  kotlin: {
    error: [
      /^e: /,
      /^error: Compilation finished with errors/,
      { re: /^Undefined symbols for architecture/, block: block({ cont: /^\s+\S/, max: 12 }) },
      /^ld: /,
    ],
    warn: [/^w: /],
  },

  // Detekt and ktlint report lines: path:line:column: message
  lintKotlin: {
    error: [/^\S+\.kts?:\d+:\d+: /],
    summary: [/^\d+ (weighted )?issues?/],
  },

  // Standalone Android lint
  androidLint: {
    error: [/^\S+:\d+: Error: /],
    warn: [/^\S+:\d+: Warning: /],
    summary: [/^\d+ errors?, \d+ warnings?/],
  },

  // adb install, push and pull
  adb: {
    never: [/^Performing (Streamed|Push) Install/],
    error: [/^(Failure|Error)\b/, /INSTALL_FAILED_/, /^adb: (error|failed)/],
    summary: [/^Success$/, /files? pushed|files? pulled/],
  },

  sdkmanager: {
    error: [/^Error: /],
    warn: [/^Warning: /],
  },

  // Xcode builds (xcodebuild, swiftc, xcpretty-formatted logs inside fastlane)
  xcode: {
    never: [
      /^ {4}\S/,
      /^Failed frontend command:/,
      /^note: /,
      /^▸ (?!.*\b(error|failed)\b)/i,
      /^Test Suite '.*' (started|passed|failed) at /,
      /^Test Case '.*' (started|passed)/,
    ],
    error: [
      { re: /^\S.*:\d+(:\d+)?: (error|fatal error): /, block: block({ cont: /^\s*(\d+ )?\|/, max: 10 }) },
      /^xcodebuild: error: /,
      /^\*\* \w+( \w+)? (FAILED|INTERRUPTED) \*\*$/,
      { re: /^The following build commands failed:/, block: block({ until: /^\(\d+ failures?\)$/, inclusive: true, max: 30 }) },
      /^Test Case '.*' failed/,
      { re: /^Testing failed:/, block: block({ cont: /^\s+\S/, max: 20 }) },
      { re: /^Failing tests:/, block: block({ cont: /^\s+\S/, max: 60 }) },
      /^✘ /,
      /recorded an issue/,
      /^❌ /,
    ],
    warn: [/^\S.*:\d+(:\d+)?: warning: /],
    summary: [/^\*\* \w+( \w+)? SUCCEEDED \*\*$/, /Executed \d+ tests?, with \d+ failures?/, /^[✔✓] Test run with /],
  },

  // Swift Package Manager (swift build, swift test, swift package resolve)
  swift: {
    never: [/^\[\d+ ?\/ ?\d+\]/, /^\[(Pre-)?[Pp]lanning/, /^Building for /, /^[◇↳] /, /^(Fetching|Fetched|Computing version|Computed|Creating working copy|Working copy of|Cloning|Cloned|Updating|Updated|Resolving|Resolved) /],
    error: [{ re: /^Note: Some test targets reported failures/, block: block({ cont: /^\s+- /, max: 20 }) }],
    summary: [/^Build complete!/],
  },

  cocoapods: {
    error: [
      { re: /^\[!\] /, block: block({ max: 15, blank: 'keep' }) },
      /CocoaPods could not find compatible versions/,
    ],
    summary: [/^Pod installation complete!/],
  },

  // Jest and Detox
  jsTest: {
    never: [/^PASS /, /^\s*[✓√] /],
    error: [
      /^FAIL /,
      /^\s*[✕×] /,
      { re: /^\s*● /, block: block({ until: /^\s*● |^(PASS|FAIL) |^Test Suites:/, max: 40, blank: 'keep' }) },
    ],
    summary: [/^Test Suites: /, /^Tests: /, /^Snapshots: /, /^Time: /],
  },

  // Metro bundler and the React Native CLI
  metro: {
    never: [/^\s*(BUNDLE|iOS|Android|Web) .*\d+(\.\d+)?% \(/, /^[\s▒░█▓▄▀#=*_.,'`/\\|-]+$/],
    error: [/Unable to resolve module/, /\b(SyntaxError|TransformError|TypeError|ReferenceError)\b/, /^error /],
    summary: [/^BUNDLE .*done/i, /Done writing bundle output/],
  },

  rnCli: {
    error: [/^error /, /^\s*ERROR\b/],
    summary: [/BUILD SUCCESSFUL|Build Succeeded|Successfully (installed|launched|built)/i],
  },

  expo: {
    error: [/^CommandError: /, /^Error: /],
    summary: [/^› (Build Succeeded|Installing|Opening)/, /^✔ /],
  },

  eas: {
    error: [/Build failed|Submission failed|Update failed/i],
    keep: [/https:\/\/expo\.dev\/\S+/],
    summary: [/^✔ (Build|Submitted|Published|Uploaded)/, /Build finished/],
  },

  npm: {
    error: [/^npm (ERR!|error) /, /^ERR_PNPM_/, /^error /, /➤ YN0(?!000)\d{3}: /],
    info: [/^npm (warn|WARN) /, /^warning /],
    summary: [/^(added|removed|changed|up to date|audited) /, /^Done in /, /^✨\s+Done/],
  },

  ts: {
    error: [/error TS\d+:/],
    summary: [/^Found \d+ errors?/],
  },

  eslint: {
    error: [/^\s+\d+:\d+\s+error\s/],
    warn: [/^\s+\d+:\d+\s+warning\s/],
    keep: [/^(\/|[A-Za-z]:\\|\.\/)\S+\.(jsx?|tsx?|mjs|cjs)$/],
    summary: [/^✖ \d+ problems?/],
  },

  fastlane: {
    pre: (line) => line.replace(/^\[\d\d:\d\d:\d\d\]: /, ''),
    error: [/fastlane finished with errors/, /^ERROR \[/, /Error building the application/, /^Exit status: [1-9]/, /^\[✗\]/],
    summary: [/fastlane\.tools (finished successfully|just saved you)/],
  },

  maestro: {
    never: [/✅/],
    error: [/❌/, /\[Failed\]/, /\bFAILED\b/],
    summary: [/\d+\/\d+ Flows? Passed/i, /Flows? (Passed|Failed)/],
  },

  swiftLint: {
    summary: [/^Done linting!/],
  },

  buildRunner: {
    error: [{ re: /^\[SEVERE\]/, block: block({ cont: /^\s+\S|^\S.*\.dart:\d+/, max: 12 }) }],
    warn: [/^\[WARNING\]/],
    summary: [/^\[INFO\] Succeeded after/, /^Built with build_runner/],
  },
};

/**
 * Stream filters for commands that never end on their own. They see each line after noise
 * removal and return false to hide it.
 */
const LOGCAT_PRIORITY = /^\d\d-\d\d \d\d:\d\d:\d\d\.\d+\s+\d+\s+\d+\s+([VDIWEFA])\s|^([VDIWEFA])\/\S/;

export const STREAM_FILTERS = {
  logcatErrors(line) {
    const match = LOGCAT_PRIORITY.exec(line);
    if (match) return 'WEFA'.includes(match[1] ?? match[2]);
    return /FATAL EXCEPTION|AndroidRuntime|ANR in |^\s+at |^\s*Caused by:/.test(line);
  },
};
