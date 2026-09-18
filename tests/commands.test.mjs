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

/** Runtime instructions, executables and shared contracts loaded by commands. */
function referencedPaths(body) {
  return [...body.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/((?:agents|skills|bin|docs)\/[A-Za-z0-9._/-]+)/g)].map(
    (match) => match[1],
  );
}

describe('commands', () => {
  it('ships at least the documented entry points', () => {
    const names = commands.map((command) => command.name).sort();
    assert.deepEqual(names, ['debate', 'debug', 'doctor', 'project', 'reis-mobile', 'review', 'test']);
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

describe('/project', () => {
  const command = commands.find((item) => item.name === 'project');

  it('resolves the app root and a monorepo profile location before writing', () => {
    assert.match(command.body, /detect --json --dir "\$PWD"/);
    assert.match(command.body, /`projectDir` as the app root/);
    assert.match(command.body, /`projectConfig` is present/);
    assert.match(command.body, /unknown stack/);
    for (const tool of ['Edit', 'Write']) assert.ok(command.data['allowed-tools'].includes(tool));
  });

  it('preserves team knowledge and requires real objects and commands', () => {
    assert.match(command.body, /replace only the content between these exact markers/);
    assert.match(command.body, /If an existing profile lacks the markers, preserve all existing text/);
    assert.match(command.body, /real object\/symbol → path → owner\/lifetime/);
    assert.match(command.body, /Never invent a domain object, test target/);
    assert.match(command.body, /Distinguish commands inspected from commands actually run/);
    assert.match(command.body, /Never copy secrets/);
  });
});

describe('/test', () => {
  const command = commands.find((item) => item.name === 'test');

  it('routes through the dedicated CLI and resolves project paths before running tests', () => {
    assert.match(command.body, /bin\/reis-mobile\.mjs" test --dir "\$PWD"/);
    assert.match(command.body, /detection\.projectDir/);
    assert.match(command.body, /context\.repoRoot/);
    assert.match(command.body, /single literal argument after `--`/);
    assert.match(command.body, /Never evaluate the request as shell code/);
  });

  it('loads the shared brief, routed agent and test references instead of a fixed agent', () => {
    for (const reference of ['docs/agent-context.md', 'agents/<Agent>.md', 'skills/<skill>/SKILL.md']) {
      assert.ok(command.body.includes('${CLAUDE_PLUGIN_ROOT}/' + reference), reference);
    }
    assert.match(command.body, /mobile-test/);
    for (const framework of ['XCTest', 'XCUITest', 'Espresso']) assert.ok(command.body.includes(framework));
    assert.match(command.body, /XCTest\/XCUITest needs the iOS reference and Espresso needs the Android reference/);
  });

  it('supports writing and fixing tests while preserving an audit-only request', () => {
    for (const tool of ['Edit', 'Write']) assert.ok(command.data['allowed-tools'].includes(tool));
    for (const request of ['Run existing tests', 'Write tests', 'Audit tests or coverage', 'Fix failing or flaky tests']) {
      assert.ok(command.body.includes(request), request);
    }
    assert.match(command.body, /Keep the audit read-only/);
    assert.match(command.body, /Without a request/);
    assert.match(command.body, /Commands not executed, their blockers/);
    assert.match(command.body, /CLI's `Language`/);
  });
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

  it('offers distinct architecture, performance and test participants for KMP', () => {
    for (const name of ['kmp-architect', 'kmp-performance-engineer', 'kmp-test-engineer']) {
      assert.ok(debate.body.includes(`reis-mobile:${name}`), name);
    }
    assert.match(debate.body, /\`kmp-\*\` Kotlin Multiplatform/);
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
    assert.match(debate.body, /at least two different models/, 'the escalation rule must enforce the mix');
  });

  it('runs the blind round before the rebuttal round', () => {
    assert.ok(
      debate.body.indexOf('Round 1') < debate.body.indexOf('Round 2'),
      'round 1 (blind positions) must come before round 2 (rebuttals)',
    );
  });
});
