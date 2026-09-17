#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compareVersions } from '../core/update/check.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';
import { isStableVersion } from './versions.mjs';

export function planRelease(version, tags) {
  if (!isStableVersion(version)) throw new Error(`Expected a stable version in package.json, got ${JSON.stringify(version)}`);
  const tag = `v${version}`;
  const versions = tags.filter((candidate) => candidate.startsWith('v')).map((candidate) => candidate.slice(1)).filter(isStableVersion);
  const latest = versions.sort((left, right) => compareVersions(right, left))[0];
  if (latest && compareVersions(version, latest) < 0) {
    throw new Error(`package.json version ${version} must be newer than v${latest}`);
  }
  if (tags.includes(tag)) return { tag, release: false };
  return { tag, release: true };
}

export function validateReleaseTag(version, tag) {
  if (!isStableVersion(version)) throw new Error(`Expected a stable version in package.json, got ${JSON.stringify(version)}`);
  if (tag !== `v${version}`) throw new Error(`Tag ${tag} does not match package.json version v${version}`);
  return { tag, release: true };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const version = JSON.parse(readFileSync(join(PLUGIN_ROOT, 'package.json'), 'utf8')).version;
  const mode = process.argv[2];
  let plan;
  if (mode === '--main') {
    const tags = execFileSync('git', ['tag', '--list', 'v*'], { cwd: PLUGIN_ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    plan = planRelease(version, tags);
  } else if (mode === '--tag') {
    plan = validateReleaseTag(version, process.argv[3]);
  } else {
    throw new Error('Usage: node scripts/release-plan.mjs --main | --tag vX.Y.Z');
  }
  console.log(`tag=${plan.tag}\nrelease=${plan.release}`);
}
