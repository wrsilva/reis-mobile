#!/usr/bin/env node
// package.json is the only editable version; plugin manifests are synchronized from it.
//
//   node scripts/versions.mjs            # check manifests agree
//   node scripts/versions.mjs --sync     # update plugin manifests
//   node scripts/versions.mjs v0.7.1     # also check the tag
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PLUGIN_ROOT } from '../core/paths.mjs';

export function readVersions(root = PLUGIN_ROOT) {
  const json = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
  const marketplace = json('.claude-plugin/marketplace.json');
  return {
    'package.json': json('package.json').version,
    '.claude-plugin/plugin.json': json('.claude-plugin/plugin.json').version,
    '.claude-plugin/marketplace.json (metadata)': marketplace.metadata.version,
    '.claude-plugin/marketplace.json (plugin)': marketplace.plugins.find((plugin) => plugin.name === 'reis-mobile')?.version,
  };
}

export function syncVersions(root = PLUGIN_ROOT) {
  const json = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
  const version = json('package.json').version;
  if (typeof version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`package.json must contain a stable version (X.Y.Z), got ${JSON.stringify(version)}`);
  }

  const pluginPath = '.claude-plugin/plugin.json';
  const marketplacePath = '.claude-plugin/marketplace.json';
  const plugin = json(pluginPath);
  const marketplace = json(marketplacePath);
  const entry = marketplace.plugins?.find((candidate) => candidate.name === 'reis-mobile');
  if (!entry) throw new Error('reis-mobile entry is missing from marketplace.json');
  if (!marketplace.metadata) throw new Error('marketplace.json is missing metadata');

  const changed = [];
  if (plugin.version !== version) {
    plugin.version = version;
    writeFileSync(join(root, pluginPath), `${JSON.stringify(plugin, null, 2)}\n`);
    changed.push(pluginPath);
  }
  if (marketplace.metadata?.version !== version || entry.version !== version) {
    marketplace.metadata.version = version;
    entry.version = version;
    writeFileSync(join(root, marketplacePath), `${JSON.stringify(marketplace, null, 2)}\n`);
    changed.push(marketplacePath);
  }
  return changed;
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
  const tag = process.argv[2] === '--sync' ? undefined : process.argv[2];
  if (process.argv[2] === '--sync') {
    const changed = syncVersions();
    console.log(changed.length ? `✓ synchronized ${changed.join(', ')}` : '✓ plugin manifests already match package.json');
  }
  const errors = checkVersions(readVersions(), tag);
  for (const error of errors) console.error(`✗ ${error}`);
  if (!errors.length) console.log(`✓ version ${readVersions()['package.json']}`);
  process.exitCode = errors.length ? 1 : 0;
}
