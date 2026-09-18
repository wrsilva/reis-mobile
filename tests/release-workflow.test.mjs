import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { it } from 'node:test';

import { PLUGIN_ROOT } from '../core/paths.mjs';

const workflow = readFileSync(join(PLUGIN_ROOT, '.github/workflows/release.yml'), 'utf8');

function runGit(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout.trim();
}

function stepScript(name) {
  const start = workflow.indexOf(`      - name: ${name}\n`);
  assert.ok(start >= 0, `${name} exists`);
  const end = workflow.indexOf('\n      - name:', start + 1);
  const section = workflow.slice(start, end < 0 ? undefined : end);
  const run = section.split('        run: |\n')[1];
  assert.ok(run, `${name} has a shell body`);
  return run.split('\n').map((line) => line.startsWith('          ') ? line.slice(10) : line).join('\n');
}

it('opens a synchronization PR instead of pushing generated files to protected main', () => {
  const sync = workflow.indexOf('node scripts/versions.mjs --sync');
  const stage = workflow.indexOf('git add ');
  const pr = workflow.indexOf('gh pr create ');
  const tag = workflow.indexOf('git tag -a ');
  const publish = workflow.indexOf('npm publish ');
  assert.ok(sync >= 0 && sync < stage && stage < pr && pr < tag && tag < publish);

  const stagedFiles = workflow.slice(stage, workflow.indexOf('\n', stage));
  for (const path of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'README.md', 'CHANGELOG.md']) {
    assert.ok(stagedFiles.split(/\s+/).includes(path), `${path} must be included in the synchronization PR`);
  }
  assert.ok(workflow.includes('pull-requests: write'));
  assert.ok(workflow.includes('git push origin "HEAD:refs/heads/$BRANCH"'));
  assert.ok(!workflow.includes('git push origin HEAD:main'), 'release automation must not bypass main branch rules');
  assert.ok(workflow.includes("echo 'pending=true' >> \"$GITHUB_OUTPUT\""));
  for (const step of ['Create release tag', 'Publish to npm', 'Create GitHub release']) {
    const section = workflow.slice(workflow.indexOf(`- name: ${step}`));
    assert.match(section.split('\n').find((line) => line.trim().startsWith('if:')), /steps\.sync_pr\.outputs\.pending != 'true'/);
  }
});

it('configures Git identity before the generated PR commit and annotated tag', () => {
  const name = workflow.indexOf("git config user.name 'github-actions[bot]'");
  const email = workflow.indexOf("git config user.email '41898282+github-actions[bot]@users.noreply.github.com'");
  const commit = workflow.indexOf('git commit -m "chore(release): synchronize files for');
  const tag = workflow.indexOf('git tag -a ');
  assert.ok(name >= 0 && name < email && email < commit && commit < tag);
  assert.ok(workflow.slice(workflow.indexOf('- name: Create release tag')).includes("git config user.name 'github-actions[bot]'"));
});

it('creates a PR branch while a remote hook forbids direct main pushes', () => {
  const root = mkdtempSync(join(tmpdir(), 'reis-mobile-release-'));
  const remote = join(root, 'remote.git');
  const local = join(root, 'checkout');
  const bin = join(root, 'bin');
  const output = join(root, 'output');
  const summary = join(root, 'summary');
  const ghLog = join(root, 'gh.log');

  try {
    mkdirSync(local);
    mkdirSync(bin);
    runGit(root, 'init', '--bare', '--initial-branch=main', remote);
    runGit(local, 'init', '--initial-branch=main');
    runGit(local, 'config', 'user.name', 'Release test');
    runGit(local, 'config', 'user.email', 'release-test@example.com');
    mkdirSync(join(local, '.claude-plugin'));
    for (const path of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'README.md', 'CHANGELOG.md']) {
      writeFileSync(join(local, path), 'old\n');
    }
    runGit(local, 'add', '.');
    runGit(local, 'commit', '-m', 'baseline');
    runGit(local, 'remote', 'add', 'origin', remote);
    runGit(local, 'push', '-u', 'origin', 'main');
    const baseline = runGit(local, 'rev-parse', 'HEAD');

    const hook = join(remote, 'hooks', 'pre-receive');
    writeFileSync(hook, '#!/bin/sh\nwhile read old new ref; do\n  [ "$ref" != "refs/heads/main" ] || exit 1\ndone\n');
    chmodSync(hook, 0o755);
    writeFileSync(join(local, 'README.md'), 'new\n');
    const gh = join(bin, 'gh');
    writeFileSync(gh, '#!/bin/sh\nif [ "$1" = pr ] && [ "$2" = list ]; then printf "0\\n"; else printf "%s\\n" "$*" >> "$GH_LOG"; fi\n');
    chmodSync(gh, 0o755);

    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', stepScript('Open pull request for synchronized release files')], {
      cwd: local,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TAG: 'v0.7.2', GH_LOG: ghLog, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(runGit(local, 'ls-remote', '--heads', 'origin', 'main').split(/\s+/)[0], baseline);
    assert.match(runGit(local, 'ls-remote', '--heads', 'origin', 'automation/release-sync-v0.7.2'), /refs\/heads\/automation\/release-sync-v0\.7\.2/);
    assert.match(readFileSync(output, 'utf8'), /pending=true/);
    assert.match(readFileSync(ghLog, 'utf8'), /pr create --base main --head automation\/release-sync-v0\.7\.2/);

    const clean = join(root, 'clean-checkout');
    const cleanOutput = join(root, 'clean-output');
    runGit(root, 'clone', '--branch', 'main', remote, clean);
    const cleanResult = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', stepScript('Open pull request for synchronized release files')], {
      cwd: clean,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TAG: 'v0.7.2', GH_LOG: ghLog, GITHUB_OUTPUT: cleanOutput, GITHUB_STEP_SUMMARY: summary },
    });
    assert.equal(cleanResult.status, 0, cleanResult.stderr);
    assert.match(readFileSync(cleanOutput, 'utf8'), /pending=false/);
    assert.equal(runGit(clean, 'rev-parse', 'HEAD'), baseline);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
