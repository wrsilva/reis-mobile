import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, it } from 'node:test';

import { PLUGIN_ROOT } from '../core/paths.mjs';
import { parseFrontmatter } from '../core/registry/frontmatter.mjs';

const COMMANDS_DIR = join(PLUGIN_ROOT, 'commands');

const commands = readdirSync(COMMANDS_DIR)
  .filter((name) => name.endsWith('.md'))
  .map((name) => {
    const path = join(COMMANDS_DIR, name);
    const source = readFileSync(path, 'utf8');
    return { name: basename(name, '.md'), path, source, ...parseFrontmatter(source) };
  });

/** `${CLAUDE_PLUGIN_ROOT}/agents/<name>.md` and `.../skills/<name>/SKILL.md` references. */
function referencedPaths(body) {
  return [...body.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/((?:agents|skills|bin)\/[A-Za-z0-9._/-]+)/g)].map(
    (match) => match[1],
  );
}

describe('commands', () => {
  it('ships at least the documented entry points', () => {
    const names = commands.map((command) => command.name).sort();
    assert.deepEqual(names, ['debate', 'doctor', 'reis-mobile', 'review']);
  });

  for (const command of commands) {
    describe(`/${command.name}`, () => {
      it('declares a description and its allowed tools', () => {
        assert.ok(command.data.description, `${command.path}: missing "description"`);
        assert.ok(
          Array.isArray(command.data['allowed-tools']) && command.data['allowed-tools'].length > 0,
          `${command.path}: missing "allowed-tools"`,
        );
      });

      it('only points at plugin files that exist', () => {
        for (const reference of referencedPaths(command.body)) {
          // Wildcards stand for a value Claude fills in at runtime (`<Agent>`, `<skill>`).
          if (reference.includes('<')) continue;
          assert.ok(existsSync(join(PLUGIN_ROOT, reference)), `${command.path}: ${reference} does not exist`);
        }
      });
    });
  }
});

describe('/debate', () => {
  const debate = commands.find((command) => command.name === 'debate');
  const agents = readdirSync(join(PLUGIN_ROOT, 'agents')).map((name) => basename(name, '.md'));

  it('names only agents this plugin ships', () => {
    const mentioned = [...debate.body.matchAll(/`reis-mobile:([a-z0-9-]+)`/g)].map((match) => match[1]);

    assert.ok(mentioned.length >= 3, 'a debate needs at least three participants to pick from');
    for (const name of mentioned) {
      assert.ok(agents.includes(name), `unknown agent "${name}"`);
    }
  });

  it('keeps the external providers optional', () => {
    assert.match(debate.body, /command -v codex/, 'must probe for the Codex CLI before calling it');
    assert.match(debate.body, /command -v gemini/, 'must probe for the Gemini CLI before calling it');
    assert.match(debate.body, /--external/, 'external providers must stay behind the --external flag');
  });

  it('assigns more than one model across the participants', () => {
    // A debate where every participant runs the same model inherits one set of blind
    // spots, so the disagreement stays on the surface of the role.
    const models = new Set([...debate.body.matchAll(/^\| `reis-mobile:[a-z0-9-]+` \|[^|]+\| `([a-z]+)` \|$/gm)].map((m) => m[1]));

    assert.ok(models.size >= 2, `participants must span at least two models, found: ${[...models].join(', ') || 'none'}`);
    assert.match(debate.body, /pelo menos dois modelos diferentes/, 'the escalation rule must enforce the mix');
  });

  it('runs the blind round before the rebuttal round', () => {
    assert.ok(
      debate.body.indexOf('Rodada 1') < debate.body.indexOf('Rodada 2'),
      'round 1 (blind positions) must come before round 2 (rebuttals)',
    );
  });
});
