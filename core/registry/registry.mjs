import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { DETECTABLE_STACKS } from '../detection/stack-detector.mjs';
import { PLUGIN_ROOT } from '../paths.mjs';
import { INTENT_IDS } from '../router/intents.mjs';
import { parseFrontmatter } from './frontmatter.mjs';

export const ANY_STACK = '*';

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
    // `routing: manual` marks helpers that Claude invokes by description only.
    routed: data.routing !== 'manual',
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

    for (const intent of component.intents) {
      if (!INTENT_IDS.includes(intent)) errors.push(`${label}: unknown intent "${intent}"`);
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
