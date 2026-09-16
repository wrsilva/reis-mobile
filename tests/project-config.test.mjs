import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { findProjectConfig, resolveProjectDir } from '../core/config/project.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';
import { FLUTTER_APP, makeProject } from './helpers/fixtures.mjs';

const monorepo = (config = 'app: apps/mobile\n') =>
  makeProject({
    '.reis-mobile/config.yaml': config,
    'apps/web/package.json': '{}',
    ...Object.fromEntries(Object.entries(FLUTTER_APP).map(([path, content]) => [`apps/mobile/${path}`, content])),
    'apps/mobile/lib/': '',
  });

describe('project config', () => {
  it('returns the requested folder when there is no config', async () => {
    const dir = await makeProject(FLUTTER_APP);

    assert.deepEqual(resolveProjectDir(dir), { projectDir: dir, config: null, warnings: [] });
  });

  it('moves the monorepo root to the app folder', async () => {
    const root = await monorepo();

    const { projectDir, config } = resolveProjectDir(root);

    assert.equal(projectDir, join(root, 'apps/mobile'));
    assert.equal(config.path, join(root, '.reis-mobile/config.yaml'));
  });

  it('finds the config from a sibling folder and still points at the app', async () => {
    const root = await monorepo();

    assert.equal(resolveProjectDir(join(root, 'apps/web')).projectDir, join(root, 'apps/mobile'));
  });

  it('keeps a folder that is already inside the app', async () => {
    const root = await monorepo();
    const inside = join(root, 'apps/mobile/lib');

    assert.equal(resolveProjectDir(inside).projectDir, inside);
    assert.equal(findProjectConfig(inside).root, root);
  });

  it('warns about unknown keys instead of failing', async () => {
    const root = await monorepo('app: apps/mobile\nlanguage: pt\n');

    assert.deepEqual(resolveProjectDir(root).warnings, [`${join(root, '.reis-mobile/config.yaml')}: unknown key "language" ignored`]);
  });

  it('rejects an app folder that does not exist or is absolute', async () => {
    const missing = await monorepo('app: apps/phone\n');
    const absolute = await monorepo('app: /etc\n');

    assert.throws(() => resolveProjectDir(missing), /app folder "apps\/phone" does not exist/);
    assert.throws(() => resolveProjectDir(absolute), /must be a folder relative to/);
  });

  it('is honored by the CLI', async () => {
    const root = await monorepo();
    const cli = (...args) => spawnSync(process.execPath, [join(PLUGIN_ROOT, 'bin/reis-mobile.mjs'), ...args], { encoding: 'utf8' });

    const detection = JSON.parse(cli('detect', '--json', '--dir', root).stdout);
    const debug = cli('debug', 'gradle build fails', '--dir', root);

    assert.equal(detection.stack, 'flutter');
    assert.equal(detection.projectDir, join(root, 'apps/mobile'));
    assert.equal(detection.projectConfig, join(root, '.reis-mobile/config.yaml'));
    assert.equal(debug.status, 0, debug.stderr);
    assert.match(debug.stdout, /^Project {5}.*apps\/mobile \(app from /m);
    assert.match(debug.stdout, /^Intent {6}debug \(explicit\) · area gradle$/m);
  });
});
