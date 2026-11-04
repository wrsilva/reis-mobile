import { existsSync, realpathSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import {
  debugPayload,
  detectPayload,
  doctorPayload,
  releasePayload,
  reviewPayload,
  routePayload,
  testPayload,
} from '../commands/payloads.mjs';
import { resolveProjectDir } from '../config/project.mjs';
import { PLUGIN_ROOT } from '../paths.mjs';
import { INTENT_IDS } from '../router/intents.mjs';

/** Agents, skills and the brief contract the agents link to; nothing else in the package. */
const READABLE = ['agents', 'skills', join('docs', 'agent-context.md')];
const MAX_READ_BYTES = 512 * 1024;

const DIR = {
  type: 'string',
  description:
    'Absolute path of the mobile app, or of a repository whose .reis-mobile/config.yaml points at it. ' +
    'Defaults to the --dir given to `reis-mobile mcp`, then to the server working directory.',
};
const BASE = { type: 'string', description: 'Git ref to compare as <base>...HEAD, such as main. Omit to use uncommitted changes.' };

// Every tool reads the project or the package and runs only local, read-only commands (git,
// toolchain --version). None edits files, builds, runs tests or calls a network service.
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

const TOOLS = [
  {
    name: 'reis_mobile_route',
    title: 'Route a mobile request',
    description:
      'Resolve a request to the reis-mobile specialist agent and skills for the detected stack. ' +
      'Returns the intent, agent and skill instruction paths: read them with reis_mobile_read_instructions and follow them. ' +
      'Pass a prompt, an intent, or both.',
    properties: {
      prompt: { type: 'string', description: 'The request in English or Portuguese, such as "the Android build of my Flutter app broke".' },
      intent: { type: 'string', enum: INTENT_IDS, description: 'Force an intent instead of detecting it from the prompt.' },
      dir: DIR,
    },
    run: ({ project, prompt, intent }) => {
      if (!prompt && !intent) throw new ToolInputError('Pass a prompt, an intent, or both.');
      return routePayload({ project, prompt, intent });
    },
  },
  {
    name: 'reis_mobile_review',
    title: 'Prepare a mobile code review',
    description:
      'Route a code review to the review agent and skills and collect the git diff to review: uncommitted changes, ' +
      'or <base>...HEAD. Lock files and generated code are excluded and secrets are masked. Does not review by itself.',
    properties: {
      prompt: { type: 'string', description: 'Optional focus, such as "focus on security".' },
      base: BASE,
      dir: DIR,
    },
    run: ({ project, prompt, base }) => reviewPayload({ project, prompt, base }),
  },
  {
    name: 'reis_mobile_debug',
    title: 'Prepare a build or runtime debug',
    description:
      'Route a build or runtime failure (Gradle, Xcode, CocoaPods, Metro, pub, crashes) to the debug agent and skills, ' +
      'with the doctor report of the installed toolchain versions. Does not change the project or its caches.',
    properties: {
      problem: { type: 'string', description: 'The error, failing command or symptom, such as "pod install fails on CI".' },
      dir: DIR,
    },
    run: ({ project, problem }) => debugPayload({ project, prompt: problem }),
  },
  {
    name: 'reis_mobile_test',
    title: 'Prepare mobile test work',
    description:
      'Route a test request to the test agent and skills for the stack, with the git diff and toolchain checks. ' +
      'Does not run tests: the agent runs, writes or audits them after reading the instructions.',
    properties: {
      request: { type: 'string', description: 'What to test, such as "write regression tests for the checkout cubit".' },
      base: BASE,
      dir: DIR,
    },
    run: ({ project, request, base }) => testPayload({ project, prompt: request, base }),
  },
  {
    name: 'reis_mobile_release',
    title: 'Prepare release readiness evidence',
    description:
      'Route a release readiness audit to the release engineer with the candidate platforms, reference paths, ' +
      'git context and toolchain checks. Does not build, sign, upload or evaluate readiness: the verdict is null.',
    properties: {
      request: { type: 'string', description: 'What to audit, such as "Android production and iOS App Store".' },
      dir: DIR,
    },
    run: ({ project, request }) => releasePayload({ project, prompt: request }),
  },
  {
    name: 'reis_mobile_detect',
    title: 'Detect the mobile stack',
    description:
      'Detect the stack of a project from its build files: Flutter, React Native or Expo, Kotlin Multiplatform, ' +
      'native Android or native iOS, with languages, target platforms and the evidence for each.',
    properties: { dir: DIR },
    run: ({ project }) => detectPayload({ project }),
  },
  {
    name: 'reis_mobile_doctor',
    title: 'Diagnose the mobile environment',
    description:
      'Check the SDKs and project files that matter for the detected stack: Flutter, Dart, Java, Android SDK, Xcode, ' +
      'CocoaPods, the Gradle wrapper and lock files. Reads versions only; installs nothing.',
    properties: {
      all: { type: 'boolean', description: 'Check every tool, not only those for the detected stack.' },
      dir: DIR,
    },
    run: ({ project, all }) => doctorPayload({ project, all }),
  },
  {
    name: 'reis_mobile_read_instructions',
    title: 'Read reis-mobile instructions',
    description:
      'Read an agent, skill or reference file shipped with reis-mobile: the agent and skill paths the other tools ' +
      'return, or a link inside one of those files resolved against that file\'s own path. Accepts an absolute path ' +
      'inside the package or a path relative to it, such as skills/mobile-debug/SKILL.md.',
    properties: {
      path: { type: 'string', description: 'The file to read, such as skills/mobile-debug/references/ios.md.' },
    },
    required: ['path'],
    readsProject: false,
    run: ({ path }) => readInstructions(path),
  },
];

const BY_NAME = new Map(TOOLS.map((tool) => [tool.name, tool]));

/** Thrown for arguments a model can correct; reported as a tool result with isError. */
class ToolInputError extends Error {}

export function listTools() {
  return TOOLS.map(({ name, title, description, properties, required }) => ({
    name,
    title,
    description,
    inputSchema: { type: 'object', properties, ...(required && { required }), additionalProperties: false },
    annotations: { title, ...READ_ONLY },
  }));
}

export function hasTool(name) {
  return BY_NAME.has(name);
}

/**
 * Runs a tool and returns its MCP result. Mistakes the model can fix (wrong arguments, a missing
 * directory) and failures inside the core come back with isError, so the model sees them.
 */
export async function callTool(name, args = {}, { defaultDir = process.cwd() } = {}) {
  const tool = BY_NAME.get(name);
  if (!tool) return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  try {
    validateArguments(tool, args);
    if (tool.readsProject === false) return { content: [{ type: 'text', text: await tool.run(args) }] };

    const project = resolveToolProject(args.dir, defaultDir);
    const payload = await tool.run({ ...args, project });
    const warnings = project.warnings.map((warning) => ({ type: 'text', text: `! ${warning}` }));
    return {
      content: [...warnings, { type: 'text', text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  } catch (error) {
    return { content: [{ type: 'text', text: error.message }], isError: true };
  }
}

function validateArguments(tool, args) {
  if (typeof args !== 'object' || args === null || Array.isArray(args)) {
    throw new ToolInputError(`${tool.name} takes an object of arguments.`);
  }
  const allowed = Object.keys(tool.properties);
  for (const [key, value] of Object.entries(args)) {
    const schema = tool.properties[key];
    if (!schema) throw new ToolInputError(`Unknown argument "${key}" for ${tool.name}. Allowed: ${allowed.join(', ')}.`);
    if (value === undefined || value === null) continue;
    if (typeof value !== schema.type) throw new ToolInputError(`"${key}" must be a ${schema.type}, got ${typeof value}.`);
    if (schema.enum && !schema.enum.includes(value)) {
      throw new ToolInputError(`"${key}" must be one of: ${schema.enum.join(', ')}. Got "${value}".`);
    }
  }
  for (const key of tool.required ?? []) {
    if (typeof args[key] !== 'string' || !args[key].trim()) throw new ToolInputError(`"${key}" is required.`);
  }
}

function resolveToolProject(dir, defaultDir) {
  const requested = resolve(defaultDir, dir ?? '.');
  if (!existsSync(requested) || !statSync(requested).isDirectory()) {
    throw new ToolInputError(`Directory not found: ${requested}. Pass the absolute path of the mobile app as "dir".`);
  }
  return resolveProjectDir(requested);
}

/** Resolves symlinks before the containment check, so a link cannot point outside the package. */
async function readInstructions(path) {
  const requested = isAbsolute(path) ? path : join(PLUGIN_ROOT, path);
  if (!existsSync(requested) || !statSync(requested).isFile()) {
    throw new ToolInputError(`No file at ${requested}. Use a path returned by another reis-mobile tool, or one relative to ${PLUGIN_ROOT}.`);
  }
  const root = realpathSync(PLUGIN_ROOT);
  const real = realpathSync(requested);
  const inside = relative(root, real);
  const readable = READABLE.some((entry) => inside === entry || inside.startsWith(`${entry}${sep}`));
  if (!readable || inside.startsWith('..') || isAbsolute(inside)) {
    throw new ToolInputError(`${path} is outside the readable instructions: ${READABLE.join(', ')} in ${root}.`);
  }
  const { size } = statSync(real);
  if (size > MAX_READ_BYTES) throw new ToolInputError(`${inside} is ${size} bytes, above the ${MAX_READ_BYTES}-byte limit.`);

  // Commands and skills written for Claude Code refer to the package as ${CLAUDE_PLUGIN_ROOT}.
  return `File: ${real}\nPackage root (\${CLAUDE_PLUGIN_ROOT}): ${root}\n\n${await readFile(real, 'utf8')}`;
}
