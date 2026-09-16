#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { LANGUAGES, configPath, removeConfig, resolveLanguage, saveLanguage } from '../core/config/language.mjs';
import { collectReviewContext } from '../core/context/context-engine.mjs';
import { detectStack } from '../core/detection/stack-detector.mjs';
import { runDoctor } from '../core/diagnostics/doctor.mjs';
import { installClaudePlugin, uninstallClaudePlugin } from '../core/install/claude-plugin.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';
import { loadRegistry, validateRegistry } from '../core/registry/registry.mjs';
import { INTENT_IDS } from '../core/router/intents.mjs';
import { route } from '../core/router/router.mjs';

const USAGE = `reis-mobile — AI agents for mobile engineering

Usage: reis-mobile <command> [options]

Commands:
  init [en|pt]               Install the reis-mobile plugin into Claude Code, optionally setting the language
  lang [en|pt]               Show or set the language the /reis-mobile commands answer in
  detect                     Detect the mobile stack of a project
  doctor                     Diagnose the environment for the detected stack
  route <prompt...>          Show which intent, agent and skills a prompt resolves to
  review [prompt...]         Route a code review and collect the git context for it
  agents | skills | stacks   List registered components
  validate                   Validate the plugin's agents, skills and stacks

Options:
  --dir <path>      Project directory (default: current directory)
  --intent <id>     Force an intent (${INTENT_IDS.join(', ')})
  --base <ref>      review: compare <ref>...HEAD instead of the working tree
  --all             doctor: check every tool, not only the relevant ones
  --strict          doctor: exit with code 1 when there are warnings
  --local           init: install the plugin from this installation instead of GitHub
  --scope <scope>   init: user (default), project or local
  --uninstall       init: remove the plugin, its marketplace and the saved language
  --lang <en|pt>    Override the saved language for this run
  --json            Machine-readable output
  -v, --version     Print the version
  -h, --help        Show this help`;

const OPTIONS = {
  dir: { type: 'string' },
  intent: { type: 'string' },
  base: { type: 'string' },
  all: { type: 'boolean' },
  strict: { type: 'boolean' },
  local: { type: 'boolean' },
  scope: { type: 'string' },
  uninstall: { type: 'boolean' },
  lang: { type: 'string' },
  json: { type: 'boolean' },
  version: { type: 'boolean', short: 'v' },
  help: { type: 'boolean', short: 'h' },
};

const COMMANDS = {
  init: commandInit,
  lang: commandLang,
  detect: commandDetect,
  doctor: commandDoctor,
  route: commandRoute,
  review: commandReview,
  agents: (options) => commandList('agents', options),
  skills: (options) => commandList('skills', options),
  stacks: (options) => commandList('stacks', options),
  validate: commandValidate,
};

async function main(argv) {
  const { values: options, positionals } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true });
  const [name, ...rest] = positionals;

  if (options.version) {
    const pkg = JSON.parse(await readFile(join(PLUGIN_ROOT, 'package.json'), 'utf8'));
    console.log(`reis-mobile ${pkg.version}`);
    return 0;
  }
  if (options.help || !name) {
    console.log(USAGE);
    return name || options.help ? 0 : 1;
  }

  const command = COMMANDS[name];
  if (!command) {
    console.error(`Unknown command "${name}".\n\n${USAGE}`);
    return 1;
  }
  return (await command({ ...options, dir: options.dir ?? process.cwd(), prompt: rest.join(' ') })) ?? 0;
}

async function commandInit({ local, scope, uninstall, lang, prompt }) {
  // The installers pass the language through REIS_MOBILE_LANG.
  const requested = lang ?? (prompt || process.env.REIS_MOBILE_LANG || undefined);
  // Validate before touching Claude Code, so a typo does not leave a half-done install.
  if (requested && !uninstall) await resolveLanguage({ flag: requested, env: {} });

  const result = uninstall
    ? uninstallClaudePlugin({ scope })
    : installClaudePlugin({ scope, ...(local && { source: PLUGIN_ROOT }) });

  if (!result.ok) {
    console.error(`✗ ${result.failedStep} failed (exit ${result.status})`);
    return 1;
  }
  if (uninstall) {
    await removeConfig();
    console.log('✓ reis-mobile removed from Claude Code');
    return 0;
  }
  if (requested) console.log(`✓ Language: ${await saveLanguage(requested)} (${configPath()})`);
  console.log('✓ reis-mobile installed in Claude Code. Restart Claude Code, then run /reis-mobile:doctor');
  return 0;
}

async function commandLang({ prompt, json }) {
  if (prompt) {
    const language = await saveLanguage(prompt);
    if (json) return print({ language, path: configPath() });
    console.log(`✓ Language: ${language} (${LANGUAGES[language]}) · saved to ${configPath()}`);
    return 0;
  }
  const language = await resolveLanguage();
  if (json) return print({ language, path: configPath() });
  console.log(language ? `${language} (${LANGUAGES[language]})` : 'not set: the commands answer in the language of each request');
  return 0;
}

async function commandDetect({ dir, json, lang }) {
  const detection = await detectStack(dir);
  const language = await resolveLanguage({ flag: lang });
  if (json) return print({ ...detection, language });

  console.log(`Stack       ${detection.stack}${detection.variant ? ` (${detection.variant})` : ''}`);
  console.log(`Languages   ${detection.languages.join(', ') || '-'}`);
  console.log(`Platforms   ${detection.platforms.join(', ') || '-'}`);
  for (const evidence of detection.evidence) console.log(`  · ${evidence}`);
  const others = detection.candidates.slice(1).map((candidate) => candidate.stack);
  if (others.length) console.log(`Also matches ${others.join(', ')}`);
  printLanguage(language);
  return detection.stack === 'unknown' ? 2 : 0;
}

async function commandDoctor({ dir, all, strict, json, lang }) {
  const report = await runDoctor({ projectDir: dir, all });
  const language = await resolveLanguage({ flag: lang });
  if (json) {
    print({ ...report, language });
  } else {
    console.log('reis-mobile doctor\n');
    for (const [section, title] of [['environment', 'Environment'], ['project', 'Project'], ['integrations', 'Integrations']]) {
      const checks = report.checks.filter((check) => check.section === section);
      if (!checks.length) continue;
      console.log(`${title}\n${'-'.repeat(title.length)}`);
      for (const check of checks) console.log(`${check.label.padEnd(16)}${SYMBOLS[check.status]} ${check.detail ?? ''}`.trimEnd());
      console.log('');
    }
    console.log(report.warnings ? `${report.warnings} warning(s)` : 'No issues found');
    printLanguage(language);
  }
  return strict && report.warnings ? 1 : 0;
}

const SYMBOLS = { ok: '✓', warning: '✗', info: '-', skipped: '-' };

async function commandRoute({ dir, intent, prompt, json, lang }) {
  if (!prompt && !intent) {
    console.error('route needs a prompt or --intent.');
    return 1;
  }
  const result = await route({ prompt, intent, projectDir: dir });
  const language = await resolveLanguage({ flag: lang });
  if (json) return print({ ...summarizeRoute(result), language });
  printRoute(result);
  printLanguage(language);
  return 0;
}

async function commandReview({ dir, base, prompt, json, lang }) {
  const result = await route({ prompt, intent: 'review', projectDir: dir });
  const context = collectReviewContext({ projectDir: dir, base });
  const language = await resolveLanguage({ flag: lang });
  if (json) return print({ ...summarizeRoute(result), language, context });

  printRoute(result);
  printLanguage(language);
  console.log(`\nContext     ${context.mode}${context.base ? ` (${context.base}...HEAD)` : ''}`);
  if (context.note) console.log(`            ${context.note}`);
  for (const file of context.files) console.log(`  ${file.status.padEnd(10)} ${file.path}`);
  if (context.diff) console.log(`\n${context.diff}`);
  return 0;
}

async function commandList(kind, { json }) {
  const registry = await loadRegistry();
  const items = registry[kind];
  if (json) return print(items);
  for (const item of items) {
    if (kind === 'stacks') {
      console.log(`${item.id.padEnd(24)}${item.name} · ${item.platforms.join(', ')}`);
    } else {
      const routing = item.routed ? `${item.intents.join(',')} @ ${item.stacks.join(',')}` : 'manual';
      console.log(`${item.name.padEnd(28)}${routing}`);
    }
  }
  return 0;
}

async function commandValidate({ json }) {
  const registry = await loadRegistry();
  const errors = validateRegistry(registry);
  if (json) {
    print({ valid: errors.length === 0, errors });
  } else if (errors.length) {
    for (const error of errors) console.error(`✗ ${error}`);
  } else {
    console.log(`✓ ${registry.stacks.length} stacks, ${registry.agents.length} agents, ${registry.skills.length} skills`);
  }
  return errors.length ? 1 : 0;
}

function summarizeRoute(result) {
  const component = (item) => item && { name: item.name, description: item.description, path: item.path };
  return { ...result, agent: component(result.agent), skills: result.skills.map(component) };
}

function printRoute(result) {
  const confidence = result.intentSource === 'explicit' ? 'explicit' : `confidence ${result.confidence}`;
  console.log(`Intent      ${result.intent ?? '-'} (${confidence})${result.area ? ` · area ${result.area}` : ''}`);
  console.log(`Stack       ${result.stack}${result.platformFocus.length ? ` · focus ${result.platformFocus.join(', ')}` : ''}`);
  console.log(`Agent       ${result.agent?.name ?? '-'}`);
  console.log(`Skills      ${result.skills.map((skill) => skill.name).join(', ') || '-'}`);
  for (const warning of result.warnings) console.log(`! ${warning}`);
}

/** `-` means no saved language: the commands follow the language of the request. */
function printLanguage(language) {
  console.log(`Language    ${language ?? '-'}`);
}

function print(value) {
  console.log(JSON.stringify(value, null, 2));
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(`reis-mobile: ${error.message}`);
    process.exitCode = 1;
  },
);
