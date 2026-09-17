import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { compareVersions } from '../core/update/check.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';
import { isStableVersion } from './version-format.mjs';

const START = '<!-- reis-mobile:latest-release:start -->';
const END = '<!-- reis-mobile:latest-release:end -->';
const RELEASE_HEADING = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/;

function currentRelease(changelog, version, date) {
  const lines = changelog.split('\n');
  const unreleased = lines.findIndex((line) => line === '## [Unreleased]');
  if (unreleased < 0) throw new Error('CHANGELOG.md needs an [Unreleased] section');
  for (const line of lines) {
    if (/^## \[\d+\.\d+\.\d+\]/.test(line) && !RELEASE_HEADING.test(line)) {
      throw new Error(`CHANGELOG.md has an invalid dated release heading: ${line}`);
    }
  }

  const releases = lines.flatMap((line, index) => {
    const match = RELEASE_HEADING.exec(line);
    return match ? [{ index, version: match[1] }] : [];
  });
  const latest = releases[0];
  if (latest && latest.index < unreleased) throw new Error('CHANGELOG.md must keep [Unreleased] before release history');

  let next = changelog;
  if (latest?.version !== version) {
    if (latest && compareVersions(version, latest.version) <= 0) {
      throw new Error(`CHANGELOG.md latest release ${latest.version} is not older than package version ${version}`);
    }
    const end = latest?.index ?? lines.length;
    const notes = lines.slice(unreleased + 1, end).join('\n').trim();
    if (!notes) throw new Error(`CHANGELOG.md needs notes under [Unreleased] for ${version}`);
    const before = lines.slice(0, unreleased + 1).join('\n');
    const after = lines.slice(end).join('\n');
    next = `${before}\n\n## [${version}] - ${date}\n\n${notes}${after ? `\n\n${after}` : '\n'}`;
  }

  const nextLines = next.split('\n');
  const releaseStart = nextLines.findIndex((line) => RELEASE_HEADING.exec(line)?.[1] === version);
  if (releaseStart < 0) throw new Error(`CHANGELOG.md has no release entry for ${version}`);
  const releaseEnd = nextLines.findIndex((line, index) => index > releaseStart && line.startsWith('## '));
  const notes = nextLines.slice(releaseStart + 1, releaseEnd < 0 ? undefined : releaseEnd).join('\n').trim();
  if (!notes) throw new Error(`CHANGELOG.md release ${version} has no notes`);
  return { changelog: next, notes };
}

function updatedReadme(readme, version, notes) {
  if (readme.split(START).length !== 2 || readme.split(END).length !== 2) {
    throw new Error('README.md needs exactly one latest-release marker pair');
  }
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (end < start) throw new Error('README.md latest-release markers are out of order');
  const content = `${START}\n### v${version}\n\n${notes.replace(/^### /gm, '#### ')}\n\n${END}`;
  return readme.slice(0, start) + content + readme.slice(end + END.length);
}

export function planReleaseDocs(root = PLUGIN_ROOT, date = new Date().toISOString().slice(0, 10)) {
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  if (!isStableVersion(version)) throw new Error(`package.json must contain a stable version, got ${JSON.stringify(version)}`);
  const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  const release = currentRelease(changelog, version, date);
  const nextReadme = updatedReadme(readme, version, release.notes);
  return [
    { path: 'CHANGELOG.md', before: changelog, after: release.changelog },
    { path: 'README.md', before: readme, after: nextReadme },
  ];
}

export function syncReleaseDocs(plan, root = PLUGIN_ROOT) {
  const changed = [];
  for (const { path, before, after } of plan) {
    if (before === after) continue;
    writeFileSync(join(root, path), after);
    changed.push(path);
  }
  return changed;
}
