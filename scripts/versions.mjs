#!/usr/bin/env node
// Every manifest must ship the same version, and a release tag must match it.
//
//   node scripts/versions.mjs            # check manifests agree
//   node scripts/versions.mjs v0.2.0     # also check the tag
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PLUGIN_NAME } from '../core/install/claude-plugin.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';

export function readVersions(root = PLUGIN_ROOT) {
  const json = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
  const marketplace = json('.claude-plugin/marketplace.json');
  return {
    'package.json': json('package.json').version,
    '.claude-plugin/plugin.json': json('.claude-plugin/plugin.json').version,
    '.claude-plugin/marketplace.json (metadata)': marketplace.metadata.version,
    '.claude-plugin/marketplace.json (plugin)': marketplace.plugins.find((plugin) => plugin.name === PLUGIN_NAME)?.version,
  };
}

export function checkVersions(versions, tag) {
  const errors = [];
  const expected = versions['package.json'];
  for (const [file, version] of Object.entries(versions)) {
    if (version !== expected) errors.push(`${file} has version ${version}, package.json has ${expected}`);
  }
  if (tag && tag !== `v${expected}`) errors.push(`tag ${tag} does not match version v${expected}`);
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = checkVersions(readVersions(), process.argv[2]);
  for (const error of errors) console.error(`✗ ${error}`);
  if (!errors.length) console.log(`✓ version ${readVersions()['package.json']}`);
  process.exitCode = errors.length ? 1 : 0;
}
