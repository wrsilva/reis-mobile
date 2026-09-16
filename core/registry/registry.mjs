import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { DETECTABLE_STACKS } from '../detection/stack-detector.mjs';
import { PLUGIN_ROOT } from '../paths.mjs';
import { AREA_IDS, INTENT_IDS } from '../router/intents.mjs';
import { parseFrontmatter } from './frontmatter.mjs';

export const ANY_STACK = '*';

/**
 * Every skill starts with `mobile-`. A topic skill covers every stack (`stacks: ["*"]`) with a
 * reference per platform; a platform skill is named after the one stack it covers.
 */
export const PLATFORM_SKILLS = {
  'mobile-flutter': 'flutter',
  'mobile-android': 'android',
  'mobile-ios': 'ios',
  'mobile-rn': 'react-native',
};

/**
 * Loads stacks (`stacks/<id>/stack.json`), agents (`agents/<name>.md`) and skills
 * (`skills/<name>/SKILL.md`). Routing metadata lives in the same frontmatter Claude Code
 * reads, so the router and the plugin can never disagree about what exists.
 */
export async function loadRegistry(root = PLUGIN_ROOT) {
  const [stacks, agents, skills] = await Promise.all([
    loadStacks(join(root, 'stacks')),
    loadAgents(join(root, 'agents')),
    loadSkills(join(root, 'skills')),
  ]);
  return { root, stacks, agents, skills };
}

async function loadStacks(dir) {
  const stacks = [];
  for (const entry of await listDir(dir)) {
    if (!entry.isDirectory()) continue;
    const path = join(dir, entry.name, 'stack.json');
    const data = JSON.parse(await readFile(path, 'utf8'));
    stacks.push({ ...data, dirName: entry.name, path });
  }
  return sortByName(stacks, 'id');
}

async function loadAgents(dir) {
  const agents = [];
  for (const entry of await listDir(dir)) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const path = join(dir, entry.name);
    agents.push(toComponent('agent', path, basename(entry.name, '.md'), await readFile(path, 'utf8')));
  }
  return sortByName(agents);
}

async function loadSkills(dir) {
  const skills = [];
  for (const entry of await listDir(dir)) {
    if (!entry.isDirectory()) continue;
    const path = join(dir, entry.name, 'SKILL.md');
    let source;
    try {
      source = await readFile(path, 'utf8');
    } catch {
      continue;
    }
    skills.push(toComponent('skill', path, entry.name, source));
  }
  return sortByName(skills);
}

function toComponent(kind, path, fileName, source) {
  const { data } = parseFrontmatter(source);
  return {
    kind,
    name: data.name,
    fileName,
    description: data.description,
    intents: asList(data.intents),
    stacks: asList(data.stacks),
    // Optional: the build areas (gradle, xcode, cocoapods...) a skill is specific to.
    areas: asList(data.areas),
    // `routing: manual` marks helpers that Claude invokes by description only.
    routed: data.routing !== 'manual',
    // Third-party components declare where they came from (see THIRD_PARTY_NOTICES.md).
    source: data.source ?? null,
    license: data.license ?? null,
    path,
  };
}

/** Structural checks for everything the plugin ships. Returns human-readable errors. */
export function validateRegistry({ stacks, agents, skills }) {
  const errors = [];
  const stackIds = new Set(stacks.map((stack) => stack.id));

  for (const stack of stacks) {
    if (stack.id !== stack.dirName) errors.push(`stack ${stack.path}: id "${stack.id}" must match its folder`);
  }
  for (const id of DETECTABLE_STACKS) {
    if (!stackIds.has(id)) errors.push(`stack "${id}" has a detector but no stacks/${id}/stack.json`);
  }

  const seen = new Set();
  for (const component of [...agents, ...skills]) {
    const label = `${component.kind} ${component.path}`;
    if (!component.name) errors.push(`${label}: missing "name"`);
    else if (component.name !== component.fileName) {
      errors.push(`${label}: name "${component.name}" must match "${component.fileName}"`);
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(component.name ?? '')) {
      errors.push(`${label}: name must be kebab-case`);
    }
    if (!component.description) errors.push(`${label}: missing "description"`);
    if (component.routed && !component.intents.length) {
      errors.push(`${label}: declare at least one intent in "intents" or set "routing: manual"`);
    }
    if (!component.stacks.length) errors.push(`${label}: declare "stacks" (use "*" for any stack)`);

    if (component.source && !component.license) errors.push(`${label}: "source" requires "license"`);

    if (component.kind === 'skill' && component.name) {
      const platform = PLATFORM_SKILLS[component.name];
      if (!component.name.startsWith('mobile-')) {
        errors.push(`${label}: skill name must start with "mobile-"`);
      } else if (platform && !(component.stacks.length === 1 && component.stacks[0] === platform)) {
        errors.push(`${label}: platform skill ${component.name} must declare stacks: [${platform}]`);
      } else if (!platform && !(component.stacks.length === 1 && component.stacks[0] === ANY_STACK)) {
        errors.push(`${label}: topic skill must declare stacks: ["*"], or be one of ${Object.keys(PLATFORM_SKILLS).join(', ')}`);
      }
    }

    for (const intent of component.intents) {
      if (!INTENT_IDS.includes(intent)) errors.push(`${label}: unknown intent "${intent}"`);
    }
    for (const area of component.areas) {
      if (!AREA_IDS.includes(area)) errors.push(`${label}: unknown area "${area}"`);
    }
    for (const stack of component.stacks) {
      if (stack !== ANY_STACK && !stackIds.has(stack)) errors.push(`${label}: unknown stack "${stack}"`);
    }

    const key = `${component.kind}:${component.name}`;
    if (seen.has(key)) errors.push(`${label}: duplicate ${component.kind} name "${component.name}"`);
    seen.add(key);
  }

  return errors;
}

function asList(value) {
  if (value === undefined || value === '') return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

async function listDir(dir) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function sortByName(items, key = 'name') {
  return items.sort((a, b) => String(a[key] ?? a.fileName).localeCompare(String(b[key] ?? b.fileName)));
}
