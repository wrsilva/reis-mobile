import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { configPath, normalizeLanguage, readConfig, removeConfig, resolveLanguage, saveLanguage } from '../core/config/language.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';
import { FLUTTER_APP, makeProject } from './helpers/fixtures.mjs';

describe('normalizeLanguage', () => {
  it('accepts the codes and names users type', () => {
    for (const value of ['en', 'eng', 'English', 'en_US']) assert.equal(normalizeLanguage(value), 'en');
    for (const value of ['pt', 'PT-BR', 'pt_br', 'portuguese']) assert.equal(normalizeLanguage(value), 'pt');
  });

  it('rejects anything else', () => {
    assert.equal(normalizeLanguage('es'), null);
    assert.equal(normalizeLanguage(undefined), null);
  });
});

describe('configPath', () => {
  it('prefers REIS_MOBILE_CONFIG, then XDG_CONFIG_HOME, then ~/.config', () => {
    assert.equal(configPath({ env: { REIS_MOBILE_CONFIG: '/tmp/c.json' } }), '/tmp/c.json');
    assert.equal(configPath({ env: { XDG_CONFIG_HOME: '/xdg' }, platform: 'linux' }), join('/xdg', 'reis-mobile', 'config.json'));
    assert.equal(configPath({ env: {}, platform: 'darwin', home: '/home/u' }), join('/home/u', '.config', 'reis-mobile', 'config.json'));
  });

  it('uses APPDATA on Windows', () => {
    assert.equal(configPath({ env: { APPDATA: 'C:\\AppData' }, platform: 'win32' }), join('C:\\AppData', 'reis-mobile', 'config.json'));
  });
});

describe('language config', () => {
  const tempConfig = async () => join(await makeProject(), 'nested', 'config.json');

  it('returns null when nothing is set', async () => {
    assert.equal(await resolveLanguage({ env: {}, path: await tempConfig() }), null);
  });

  it('saves the normalized language and keeps other keys', async () => {
    const path = await tempConfig();
    await saveLanguage('eng', path);
    await writeFile(path, JSON.stringify({ ...(await readConfig(path)), other: true }));

    assert.equal(await saveLanguage('pt-BR', path), 'pt');
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), { language: 'pt', other: true });
  });

  it('lets the flag beat the environment and the environment beat the file', async () => {
    const path = await tempConfig();
    await saveLanguage('pt', path);

    assert.equal(await resolveLanguage({ env: {}, path }), 'pt');
    assert.equal(await resolveLanguage({ env: { REIS_MOBILE_LANG: 'en' }, path }), 'en');
    assert.equal(await resolveLanguage({ flag: 'pt', env: { REIS_MOBILE_LANG: 'en' }, path }), 'pt');
  });

  it('fails loudly on an unknown language or a broken file', async () => {
    const path = await tempConfig();
    await assert.rejects(saveLanguage('klingon', path), /Unknown language "klingon"/);
    await assert.rejects(resolveLanguage({ flag: 'xx', env: {}, path }), /--lang: Unknown language/);

    await saveLanguage('en', path);
    await writeFile(path, '{ not json');
    await assert.rejects(readConfig(path), /Invalid JSON/);
  });

  it('removes the file on uninstall, even when it does not exist', async () => {
    const path = await tempConfig();
    await saveLanguage('pt', path);
    await removeConfig(path);
    await removeConfig(path);

    assert.deepEqual(await readConfig(path), {});
  });
});

describe('mobile CLI language', () => {
  const cli = (config, ...args) =>
    spawnSync(process.execPath, [join(PLUGIN_ROOT, 'bin/mobile.mjs'), ...args], {
      encoding: 'utf8',
      env: { ...process.env, REIS_MOBILE_CONFIG: config, REIS_MOBILE_LANG: '' },
    });

  it('saves the language with `lang` and reports it in route, review and detect', async () => {
    const config = join(await makeProject(), 'config.json');
    const dir = await makeProject(FLUTTER_APP);

    assert.equal(cli(config, 'lang', 'pt').status, 0);
    assert.equal(JSON.parse(cli(config, 'lang', '--json').stdout).language, 'pt');
    assert.equal(JSON.parse(cli(config, 'route', 'review my code', '--json', '--dir', dir).stdout).language, 'pt');
    assert.equal(JSON.parse(cli(config, 'review', '--json', '--dir', dir).stdout).language, 'pt');
    assert.equal(JSON.parse(cli(config, 'detect', '--json', '--dir', dir).stdout).language, 'pt');
    assert.match(cli(config, 'route', 'review my code', '--dir', dir).stdout, /^Language {4}pt$/m);
  });

  it('lets --lang override the saved language for one run', async () => {
    const config = join(await makeProject(), 'config.json');
    const dir = await makeProject(FLUTTER_APP);
    cli(config, 'lang', 'pt');

    assert.equal(JSON.parse(cli(config, 'route', 'review', '--json', '--lang', 'en', '--dir', dir).stdout).language, 'en');
  });

  it('prints "-" when no language is saved', async () => {
    const config = join(await makeProject(), 'config.json');
    const dir = await makeProject(FLUTTER_APP);

    assert.match(cli(config, 'route', 'review my code', '--dir', dir).stdout, /^Language {4}-$/m);
  });

  it('rejects an unknown language in init before calling Claude Code', async () => {
    const result = cli(join(await makeProject(), 'config.json'), 'init', 'klingon');

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unknown language "klingon"/);
  });
});
