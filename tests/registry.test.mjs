import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

  it('reports broken components', async () => {
    const root = await makeProject({
      'stacks/flutter/stack.json': JSON.stringify({ id: 'flutter' }),
      'agents/reviewer.md': '---\nname: other-name\nintents: [review]\nstacks: [flutter]\n---\n',
      'skills/bad-skill/SKILL.md': '---\nname: bad-skill\ndescription: x\nintents: [cook]\nstacks: [symbian]\nareas: [kitchen]\n---\n',
      'skills/mobile-helper/SKILL.md': '---\nname: mobile-helper\ndescription: x\nrouting: manual\nstacks: ["*"]\n---\n',
      'skills/generic-helper/SKILL.md': '---\nname: generic-helper\ndescription: x\nrouting: manual\nstacks: ["*"]\n---\n',
      'skills/flutter-helper/SKILL.md': '---\nname: flutter-helper\ndescription: x\nrouting: manual\nstacks: [ios]\n---\n',
      'skills/vendored/SKILL.md': '---\nname: vendored\ndescription: x\nrouting: manual\nstacks: ["*"]\nsource: https://example.com\n---\n',
    });

    const errors = validateRegistry(await loadRegistry(root));

    assert.ok(errors.some((error) => error.includes('name "other-name" must match "reviewer"')));
    assert.ok(errors.some((error) => error.includes('reviewer.md: missing "description"')));
    assert.ok(errors.some((error) => error.includes('unknown intent "cook"')));
    assert.ok(errors.some((error) => error.includes('unknown area "kitchen"')));
    assert.ok(errors.some((error) => error.includes('generic-helper/SKILL.md: skill name must start with "mobile-" for stack "*"')));
    assert.ok(errors.some((error) => error.includes('flutter-helper/SKILL.md: skill name must start with "ios-" for stack "ios"')));
    assert.ok(errors.some((error) => error.includes('unknown stack "symbian"')));
    assert.ok(errors.some((error) => error.includes('stack "android" has a detector but no stacks/android/stack.json')));
    assert.ok(!errors.some((error) => error.includes('mobile-helper')), 'manual skills need no intents');
    assert.ok(errors.some((error) => error.includes('vendored/SKILL.md: "source" requires "license"')));
  });
});
