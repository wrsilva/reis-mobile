import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { redactSecrets } from '../security/redact.mjs';

const DEFAULT_MAX_DIFF_BYTES = 80_000;

// Generated and lock files are listed as changed but kept out of the diff body.
const DIFF_EXCLUDES = [
  ':(exclude,glob)**/pubspec.lock',
  ':(exclude,glob)**/Podfile.lock',
  ':(exclude,glob)**/package-lock.json',
  ':(exclude,glob)**/yarn.lock',
  ':(exclude,glob)**/pnpm-lock.yaml',
  ':(exclude,glob)**/Package.resolved',
  ':(exclude,glob)**/*.g.dart',
  ':(exclude,glob)**/*.freezed.dart',
  ':(exclude,glob)**/*.pbxproj',
];

/**
 * Collects what a reviewer needs: which files changed and the (redacted, truncated) diff.
 *
 * Paths are relative to the repository root; changes are limited to `projectDir`, so a
 * mobile app inside a monorepo only sees its own files.
 *
 * Modes:
 * - `range`: `--base <ref>` given, compares `<ref>...HEAD` (pull request style).
 * - `working-tree`: uncommitted changes against HEAD, plus untracked files.
 * - `project`: nothing changed (or not a git repo); the reviewer audits the project itself.
 */
export function collectReviewContext({ projectDir = process.cwd(), base, maxDiffBytes = DEFAULT_MAX_DIFF_BYTES } = {}) {
  const cwd = resolve(projectDir);
  const topLevel = git(cwd, ['rev-parse', '--show-toplevel']);
  if (!topLevel.ok) {
    return emptyContext(cwd, 'project', 'Not a git repository; reviewing the project as a whole.');
  }

  const hasHead = git(cwd, ['rev-parse', '--verify', '--quiet', 'HEAD']).ok;
  let nameStatus;
  let diff;
  let mode;

  if (base) {
    const range = `${base}...HEAD`;
    nameStatus = git(cwd, ['diff', '--name-status', range, '--', '.']);
    if (!nameStatus.ok) throw new Error(`git diff ${range} failed: ${nameStatus.stderr.trim()}`);
    diff = git(cwd, ['diff', range, '--', '.', ...DIFF_EXCLUDES]);
    mode = 'range';
  } else if (hasHead) {
    nameStatus = git(cwd, ['diff', '--name-status', 'HEAD', '--', '.']);
    diff = git(cwd, ['diff', 'HEAD', '--', '.', ...DIFF_EXCLUDES]);
    mode = 'working-tree';
  } else {
    nameStatus = git(cwd, ['diff', '--cached', '--name-status', '--', '.']);
    diff = git(cwd, ['diff', '--cached', '--', '.', ...DIFF_EXCLUDES]);
    mode = 'working-tree';
  }

  const files = parseNameStatus(nameStatus.stdout);
  if (mode === 'working-tree') {
    const untracked = git(cwd, ['ls-files', '--others', '--exclude-standard', '--full-name']).stdout;
    for (const path of untracked.split('\n').filter(Boolean)) files.push({ status: 'untracked', path });
  }

  if (!files.length) {
    return emptyContext(topLevel.stdout.trim(), 'project', 'No changes found; reviewing the project as a whole.');
  }

  const fullDiff = redactSecrets(diff.stdout);
  const truncated = Buffer.byteLength(fullDiff) > maxDiffBytes;

  return {
    repoRoot: topLevel.stdout.trim(),
    mode,
    base: base ?? null,
    files,
    diff: truncated ? truncateUtf8(fullDiff, maxDiffBytes) : fullDiff,
    diffTruncated: truncated,
    note: truncated
      ? `Diff truncated to ${maxDiffBytes} bytes; read the remaining changed files directly.`
      : null,
  };
}

function emptyContext(repoRoot, mode, note) {
  return { repoRoot, mode, base: null, files: [], diff: '', diffTruncated: false, note };
}

const STATUS_NAMES = { A: 'added', M: 'modified', D: 'deleted', R: 'renamed', C: 'copied', T: 'type-changed' };

function parseNameStatus(output) {
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [code, ...paths] = line.split('\t');
      return { status: STATUS_NAMES[code[0]] ?? code, path: paths.at(-1) };
    });
}

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? String(result.error ?? ''),
  };
}

function truncateUtf8(text, maxBytes) {
  return Buffer.from(text).subarray(0, maxBytes).toString('utf8').replace(/�$/, '');
}
