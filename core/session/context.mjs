import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { resolveProjectDir } from '../config/project.mjs';
import { detectStack } from '../detection/stack-detector.mjs';
import { PLUGIN_ROOT } from '../paths.mjs';

function stackName(stack) {
  try {
    return JSON.parse(readFileSync(join(PLUGIN_ROOT, 'stacks', stack, 'stack.json'), 'utf8')).name ?? stack;
  } catch {
    return stack;
  }
}

/**
 * The rules a session in a mobile project follows from its first message: report progress,
 * never block on a command that does not end, explain decisions. Null outside a mobile
 * project or with REIS_MOBILE_SESSION_CONTEXT=0.
 */
export async function sessionContext(cwd, { env = process.env } = {}) {
  if (!cwd || env.REIS_MOBILE_SESSION_CONTEXT === '0') return null;
  let projectDir = cwd;
  try {
    projectDir = resolveProjectDir(cwd).projectDir;
  } catch {
    // A broken .reis-mobile/config.yaml must not break the session; detect from cwd.
  }
  const detection = await detectStack(projectDir);
  if (detection.stack === 'unknown') return null;
  return contextFor(detection.stack, projectDir);
}

export function contextFor(stack, projectDir) {
  const cli = `node "${join(PLUGIN_ROOT, 'bin', 'reis-mobile.mjs')}" run`;
  return `reis-mobile: ${stackName(stack)} project at ${projectDir}. For every action in this session:

1. Keep the user informed. Before a step that can take more than about 30 seconds (a build, a test suite, pod install, an emulator boot, an app launch), say what will run, in which directory and on which device, why it is needed now and what result you expect. Report each phase as it happens, naming the real object (Gradle task, device id, file), and finish with the command, exit code, duration, the first failing line quoted and the log path. "Working on it" says nothing.

2. Never run a command that does not end on its own in the foreground: flutter run, flutter attach, flutter logs, emulator, react-native start, expo start, npm start or dev, adb logcat without -d, simctl log stream. Start it with \`${cli} --background -- <command>\`: it shows progress, returns when the app is ready, failed or the wait ended, and prints the PID, the log and the stop command. Continue with \`${cli} --follow <log>\` and stop with \`${cli} --stop <log>\`. A build that may outlast the tool timeout goes through --background as well. Run finite builds and tests as \`${cli} -- <command>\`.

3. Explain every decision that changes code, configuration, dependencies, the device or the next diagnostic step: the decision, naming the object; the evidence (path:line, the quoted log line, the version from the lock file); the alternatives you rejected, each with the concrete reason it loses here; and how to verify and revert it. "Best practice" or "cleaner" is not a reason until it is tied to this project. When evidence is missing, say what is missing and how you will get it.

Full contract: ${join(PLUGIN_ROOT, 'docs', 'agent-context.md')} (Progress and decisions). Ready and failure signals per stack: ${join(PLUGIN_ROOT, 'skills', 'mobile-debug', 'references', 'launching.md')}.`;
}
