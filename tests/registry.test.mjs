import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';

import { PLUGIN_ROOT } from '../core/paths.mjs';
import { parseFrontmatter } from '../core/registry/frontmatter.mjs';
import { loadRegistry, validateRegistry } from '../core/registry/registry.mjs';
import { makeProject } from './helpers/fixtures.mjs';

describe('parseFrontmatter', () => {
  it('parses scalars, inline lists, block lists and quotes', () => {
    const { data, body } = parseFrontmatter(
      [
        '---',
        'name: flutter-widget-review',
        'description: "Reviews widgets: lifecycle, rebuilds"',
        'intents: [review, performance]',
        'stacks: ["*"]',
        'tools:',
        '  - Read',
        "  - 'Grep'",
        'enabled: true',
        '# comment',
        '---',
        '# Body',
      ].join('\n'),
    );

    assert.deepEqual(data, {
      name: 'flutter-widget-review',
      description: 'Reviews widgets: lifecycle, rebuilds',
      intents: ['review', 'performance'],
      stacks: ['*'],
      tools: ['Read', 'Grep'],
      enabled: true,
    });
    assert.equal(body, '# Body');
  });

  it('parses literal and folded block scalars and skips nested maps', () => {
    const { data } = parseFrontmatter(
      [
        '---',
        'name: flutter-dart-migrate-to-checks-package',
        'description: |-',
        '  Replace `expect`',
        '  with `checks`.',
        'summary: >-',
        '  Folded into',
        '  one line.',
        'metadata:',
        '  model: some-model',
        'stacks: [flutter]',
        '---',
      ].join('\n'),
    );

    assert.equal(data.description, 'Replace `expect`\nwith `checks`.');
    assert.equal(data.summary, 'Folded into one line.');
    assert.deepEqual(data.stacks, ['flutter']);
  });

  it('joins a plain scalar continued on indented lines, as upstream skills write descriptions', () => {
    const { data } = parseFrontmatter(
      '---\nname: r8-analyzer\ndescription: Analyzes build files and keep rules,\n  broad package-wide rules, and\n  library rules.\nlicense: Apache-2.0\nmetadata:\n  author: Google LLC\n  keywords:\n  - R8\n---\nBody',
    );

    assert.equal(data.description, 'Analyzes build files and keep rules, broad package-wide rules, and library rules.');
    assert.equal(data.license, 'Apache-2.0');
    assert.equal(data.name, 'r8-analyzer');
  });

  it('returns the whole source as body when there is no frontmatter', () => {
    assert.deepEqual(parseFrontmatter('# Title'), { data: {}, body: '# Title' });
  });
});

describe('plugin registry', () => {
  it('ships a valid set of stacks, agents and skills', async () => {
    const registry = await loadRegistry();

    assert.deepEqual(validateRegistry(registry), []);
    assert.ok(registry.agents.some((agent) => agent.name === 'mobile-code-reviewer'));
  });

  it('credits every third-party component in THIRD_PARTY_NOTICES.md', async () => {
    const notices = readFileSync(join(PLUGIN_ROOT, 'THIRD_PARTY_NOTICES.md'), 'utf8');
    const { agents, skills } = await loadRegistry();

    for (const component of [...agents, ...skills].filter((item) => item.source)) {
      assert.ok(notices.includes(`Source: ${component.source}`), `${component.source} is listed`);
      assert.ok(notices.includes(`\`${component.name}\``), `${component.name} is listed`);
    }
  });

  it('links every platform reference a multi-platform skill ships', async () => {
    const { skills } = await loadRegistry();
    const platformGuides = ['flutter.md', 'android.md', 'ios.md', 'react-native.md'];

    for (const skill of skills.filter((item) => item.name.startsWith('mobile-'))) {
      const body = readFileSync(skill.path, 'utf8');
      for (const guide of platformGuides) {
        if (existsSync(join(dirname(skill.path), 'references', guide))) {
          assert.ok(body.includes(`(references/${guide})`), `${skill.name} links references/${guide}`);
        }
      }
    }
  });

  it('keeps every relative Markdown link inside skills pointing at a file', () => {
    const root = join(PLUGIN_ROOT, 'skills');
    const files = readdirSync(root, { recursive: true }).filter((file) => file.endsWith('.md'));

    for (const file of files) {
      const text = readFileSync(join(root, file), 'utf8').replace(/```[\s\S]*?```/g, '');
      for (const [, target] of text.matchAll(/\]\(([^)\s#]+\.md)(?:#[^)]*)?\)/g)) {
        if (/^[a-z]+:\/\//.test(target)) continue;
        assert.ok(existsSync(join(root, dirname(file), target)), `${file} links ${target}`);
      }
    }
  });

  it('credits every adapted reference file in THIRD_PARTY_NOTICES.md', () => {
    const notices = readFileSync(join(PLUGIN_ROOT, 'THIRD_PARTY_NOTICES.md'), 'utf8');
    const files = readdirSync(join(PLUGIN_ROOT, 'skills'), { recursive: true }).filter((file) => file.endsWith('.md'));
    let adapted = 0;

    for (const file of files) {
      const firstLine = readFileSync(join(PLUGIN_ROOT, 'skills', file), 'utf8').split('\n', 1)[0];
      const match = /^> Adapted from the `([^`]+)` skill in \[[^\]]+\]\((https:\/\/github\.com\/[^)]+)\)/.exec(firstLine);
      if (!match) continue;
      adapted++;
      assert.ok(notices.includes(`Source: ${match[2]}`), `${file}: ${match[2]} is listed`);
      assert.ok(notices.includes(`\`${match[1]}\` → `), `${file}: upstream skill ${match[1]} is listed`);
    }
    assert.ok(adapted >= 25, 'the consolidated test and Firebase guides are credited');
  });

  it('reports broken components', async () => {
    const root = await makeProject({
      'stacks/flutter/stack.json': JSON.stringify({ id: 'flutter' }),
      'agents/reviewer.md': '---\nname: other-name\nintents: [review]\nstacks: [flutter]\n---\n',
      'skills/bad-skill/SKILL.md': '---\nname: bad-skill\ndescription: x\nintents: [cook]\nstacks: [symbian]\nareas: [kitchen]\n---\n',
      'skills/mobile-helper/SKILL.md': '---\nname: mobile-helper\ndescription: x\nrouting: manual\nstacks: ["*"]\n---\n',
      'skills/generic-helper/SKILL.md': '---\nname: generic-helper\ndescription: x\nrouting: manual\nstacks: ["*"]\n---\n',
      'skills/flutter-helper/SKILL.md': '---\nname: flutter-helper\ndescription: x\nrouting: manual\nstacks: [ios]\n---\n',
      'skills/mobile-ios/SKILL.md': '---\nname: mobile-ios\ndescription: x\nrouting: manual\nstacks: [flutter]\n---\n',
      'skills/mobile-widgets/SKILL.md': '---\nname: mobile-widgets\ndescription: x\nrouting: manual\nstacks: [flutter]\n---\n',
      'skills/vendored/SKILL.md': '---\nname: vendored\ndescription: x\nrouting: manual\nstacks: ["*"]\nsource: https://example.com\n---\n',
    });

    const errors = validateRegistry(await loadRegistry(root));

    assert.ok(errors.some((error) => error.includes('name "other-name" must match "reviewer"')));
    assert.ok(errors.some((error) => error.includes('reviewer.md: missing "description"')));
    assert.ok(errors.some((error) => error.includes('unknown intent "cook"')));
    assert.ok(errors.some((error) => error.includes('unknown area "kitchen"')));
    assert.ok(errors.some((error) => error.includes('generic-helper/SKILL.md: skill name must start with "mobile-"')));
    assert.ok(errors.some((error) => error.includes('flutter-helper/SKILL.md: skill name must start with "mobile-"')));
    assert.ok(errors.some((error) => error.includes('platform skill mobile-ios must declare stacks: [ios]')));
    assert.ok(errors.some((error) => error.includes('mobile-widgets/SKILL.md: topic skill must declare stacks: ["*"]')));
    assert.ok(errors.some((error) => error.includes('unknown stack "symbian"')));
    assert.ok(errors.some((error) => error.includes('stack "android" has a detector but no stacks/android/stack.json')));
    assert.ok(!errors.some((error) => error.includes('mobile-helper')), 'manual skills need no intents');
    assert.ok(errors.some((error) => error.includes('vendored/SKILL.md: "source" requires "license"')));
  });
});
