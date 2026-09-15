import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

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

  it('reports broken components', async () => {
    const root = await makeProject({
      'stacks/flutter/stack.json': JSON.stringify({ id: 'flutter' }),
      'agents/reviewer.md': '---\nname: other-name\nintents: [review]\nstacks: [flutter]\n---\n',
      'skills/bad-skill/SKILL.md': '---\nname: bad-skill\ndescription: x\nintents: [cook]\nstacks: [symbian]\n---\n',
      'skills/helper/SKILL.md': '---\nname: helper\ndescription: x\nrouting: manual\nstacks: ["*"]\n---\n',
    });

    const errors = validateRegistry(await loadRegistry(root));

    assert.ok(errors.some((error) => error.includes('name "other-name" must match "reviewer"')));
    assert.ok(errors.some((error) => error.includes('reviewer.md: missing "description"')));
    assert.ok(errors.some((error) => error.includes('unknown intent "cook"')));
    assert.ok(errors.some((error) => error.includes('unknown stack "symbian"')));
    assert.ok(errors.some((error) => error.includes('stack "android" has a detector but no stacks/android/stack.json')));
    assert.ok(!errors.some((error) => error.includes('helper')), 'manual skills need no intents');
  });
});
