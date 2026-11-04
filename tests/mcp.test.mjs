import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { describe, it } from 'node:test';

import { ERROR_CODES, LEGACY_VERSIONS, MODERN_VERSIONS, createMcpServer, serveStdio } from '../core/mcp/server.mjs';
import { callTool, listTools } from '../core/mcp/tools.mjs';
import { PLUGIN_ROOT } from '../core/paths.mjs';
import { FLUTTER_APP, git, makeProject } from './helpers/fixtures.mjs';

const BIN = join(PLUGIN_ROOT, 'bin/reis-mobile.mjs');
const MODERN_META = {
  'io.modelcontextprotocol/protocolVersion': MODERN_VERSIONS[0],
  'io.modelcontextprotocol/clientCapabilities': {},
};

const request = (id, method, params) => ({ jsonrpc: '2.0', id, method, ...(params && { params }) });
const cliJson = (...args) => JSON.parse(spawnSync(process.execPath, [BIN, ...args, '--json'], { encoding: 'utf8' }).stdout);

async function initialized(options = {}) {
  const server = createMcpServer({ version: '9.9.9', ...options });
  await server.handle(request(0, 'initialize', { protocolVersion: LEGACY_VERSIONS[0], capabilities: {}, clientInfo: { name: 'test', version: '0' } }));
  return server;
}

describe('MCP protocol: legacy clients (initialize handshake)', () => {
  it('echoes a supported legacy version and describes the server', async () => {
    const server = createMcpServer({ version: '9.9.9' });
    const response = await server.handle(request(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {} }));

    assert.deepEqual(response.result.capabilities, { tools: {} });
    assert.equal(response.result.protocolVersion, '2025-06-18');
    assert.deepEqual(response.result.serverInfo, { name: 'reis-mobile', title: 'reis-mobile', version: '9.9.9' });
    assert.match(response.result.instructions, /reis_mobile_read_instructions/);
    assert.equal(response.result.resultType, undefined, 'legacy results carry no resultType');
  });

  it('answers an unknown version with the latest legacy revision', async () => {
    const response = await createMcpServer({ version: '1' }).handle(request(1, 'initialize', { protocolVersion: '1900-01-01' }));
    assert.equal(response.result.protocolVersion, LEGACY_VERSIONS[0]);
  });

  it('rejects requests before initialize unless they carry modern _meta', async () => {
    const server = createMcpServer({ version: '1' });
    const response = await server.handle(request(1, 'tools/list'));

    assert.equal(response.error.code, ERROR_CODES.invalidParams);
    assert.match(response.error.message, /Send initialize first/);
    assert.deepEqual(response.error.data.supported, [...MODERN_VERSIONS, ...LEGACY_VERSIONS]);
  });

  it('answers ping before initialize', async () => {
    assert.deepEqual((await createMcpServer({ version: '1' }).handle(request(1, 'ping'))).result, {});
  });

  it('lists tools after initialize without a resultType', async () => {
    const response = await (await initialized()).handle(request(2, 'tools/list'));
    assert.equal(response.result.resultType, undefined);
    assert.equal(response.result.tools.length, listTools().length);
  });

  it('does not offer server/discover to a legacy session', async () => {
    const response = await (await initialized()).handle(request(2, 'server/discover'));
    assert.equal(response.error.code, ERROR_CODES.methodNotFound);
  });
});

describe('MCP protocol: modern clients (per-request _meta)', () => {
  it('serves server/discover with the modern versions and the server identity', async () => {
    const response = await createMcpServer({ version: '9.9.9' }).handle(request('d', 'server/discover', { _meta: MODERN_META }));

    assert.equal(response.result.resultType, 'complete');
    assert.deepEqual(response.result.supportedVersions, MODERN_VERSIONS);
    assert.deepEqual(response.result.capabilities, { tools: {} });
    assert.deepEqual(response.result._meta['io.modelcontextprotocol/serverInfo'], { name: 'reis-mobile', title: 'reis-mobile', version: '9.9.9' });
  });

  it('marks every modern result complete, tools/list included', async () => {
    const response = await createMcpServer({ version: '1' }).handle(request(1, 'tools/list', { _meta: MODERN_META }));
    assert.equal(response.result.resultType, 'complete');
    assert.ok(response.result.tools.length > 0);
  });

  it('rejects an unsupported version with -32022 and the supported list', async () => {
    const _meta = { ...MODERN_META, 'io.modelcontextprotocol/protocolVersion': '1900-01-01' };
    const response = await createMcpServer({ version: '1' }).handle(request(1, 'tools/list', { _meta }));

    assert.equal(response.error.code, ERROR_CODES.unsupportedVersion);
    assert.deepEqual(response.error.data, { supported: [...MODERN_VERSIONS, ...LEGACY_VERSIONS], requested: '1900-01-01' });
  });

  it('rejects a modern request without client capabilities', async () => {
    const _meta = { 'io.modelcontextprotocol/protocolVersion': MODERN_VERSIONS[0] };
    const response = await createMcpServer({ version: '1' }).handle(request(1, 'tools/list', { _meta }));
    assert.equal(response.error.code, ERROR_CODES.invalidParams);
    assert.match(response.error.message, /clientCapabilities/);
  });

  it('serves a modern request on a process a legacy client initialized', async () => {
    const response = await (await initialized()).handle(request(3, 'server/discover', { _meta: MODERN_META }));
    assert.equal(response.result.resultType, 'complete');
  });
});

describe('MCP protocol: JSON-RPC errors', () => {
  it('ignores notifications', async () => {
    assert.equal(await (await initialized()).handle({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  });

  for (const [label, message, code] of [
    ['a batch', [request(1, 'ping')], ERROR_CODES.invalidRequest],
    ['a wrong jsonrpc version', { jsonrpc: '1.0', id: 1, method: 'ping' }, ERROR_CODES.invalidRequest],
    ['a null id', { jsonrpc: '2.0', id: null, method: 'ping' }, ERROR_CODES.invalidRequest],
    ['array params', { jsonrpc: '2.0', id: 1, method: 'tools/list', params: [] }, ERROR_CODES.invalidParams],
    ['an unknown method', request(1, 'resources/list'), ERROR_CODES.methodNotFound],
    ['an unknown tool', request(1, 'tools/call', { name: 'reis_mobile_consult' }), ERROR_CODES.invalidParams],
    ['non-object arguments', request(1, 'tools/call', { name: 'reis_mobile_detect', arguments: 'x' }), ERROR_CODES.invalidParams],
  ]) {
    it(`answers ${label} with ${code}`, async () => {
      const response = await (await initialized()).handle(message);
      assert.equal(response.error.code, code);
    });
  }
});

describe('MCP tools', () => {
  it('declares eight read-only, offline tools with closed input schemas', () => {
    const tools = listTools();
    assert.deepEqual(tools.map((tool) => tool.name), [
      'reis_mobile_route',
      'reis_mobile_review',
      'reis_mobile_debug',
      'reis_mobile_test',
      'reis_mobile_release',
      'reis_mobile_detect',
      'reis_mobile_doctor',
      'reis_mobile_read_instructions',
    ]);
    for (const tool of tools) {
      assert.match(tool.name, /^[A-Za-z0-9_.-]{1,128}$/);
      assert.equal(tool.inputSchema.type, 'object');
      assert.equal(tool.inputSchema.additionalProperties, false);
      assert.deepEqual(
        [tool.annotations.readOnlyHint, tool.annotations.destructiveHint, tool.annotations.idempotentHint, tool.annotations.openWorldHint],
        [true, false, true, false],
        `${tool.name} annotations`,
      );
    }
  });

  it('returns the same JSON as `detect --json`, as structured content and as text', async () => {
    const dir = await makeProject(FLUTTER_APP);
    const result = await callTool('reis_mobile_detect', { dir });

    assert.equal(result.isError, undefined);
    assert.deepEqual(result.structuredContent, cliJson('detect', '--dir', dir));
    assert.deepEqual(JSON.parse(result.content.at(-1).text), result.structuredContent);
  });

  it('returns the same JSON as `route --json`', async () => {
    const dir = await makeProject(FLUTTER_APP);
    const result = await callTool('reis_mobile_route', { dir, prompt: 'write tests for the login cubit' });

    assert.deepEqual(result.structuredContent, cliJson('route', '--dir', dir, 'write', 'tests', 'for', 'the', 'login', 'cubit'));
    assert.equal(result.structuredContent.agent.name, 'flutter-test-engineer');
  });

  it('returns the same JSON as `review --json`, with the diff', async () => {
    const dir = await makeProject(FLUTTER_APP);
    git(dir, 'init');
    git(dir, 'add', '.');
    git(dir, 'commit', '-m', 'init');
    await writeFile(join(dir, 'lib/main.dart'), 'void main() { print(1); }\n');

    const result = await callTool('reis_mobile_review', { dir });
    assert.deepEqual(result.structuredContent, cliJson('review', '--dir', dir));
    assert.match(result.structuredContent.context.diff, /print\(1\)/);
  });

  it('adds the doctor report to debug and the release context to release', async () => {
    const dir = await makeProject(FLUTTER_APP);
    const debug = await callTool('reis_mobile_debug', { dir, problem: 'pod install fails' });
    const release = await callTool('reis_mobile_release', { dir });

    assert.equal(debug.structuredContent.intent, 'debug');
    assert.ok(Array.isArray(debug.structuredContent.doctor.checks));
    assert.equal(release.structuredContent.intent, 'release');
    assert.equal(release.structuredContent.release.verdict, null);
  });

  it('uses the default directory and resolves a relative dir against it', async () => {
    const root = await makeProject({ 'apps/mobile/pubspec.yaml': FLUTTER_APP['pubspec.yaml'] });

    const byDefault = await callTool('reis_mobile_detect', {}, { defaultDir: join(root, 'apps/mobile') });
    const relative = await callTool('reis_mobile_detect', { dir: 'apps/mobile' }, { defaultDir: root });
    assert.equal(byDefault.structuredContent.stack, 'flutter');
    assert.equal(relative.structuredContent.stack, 'flutter');
  });

  it('follows app: in .reis-mobile/config.yaml and reports its warnings as text', async () => {
    const root = await makeProject({
      '.reis-mobile/config.yaml': 'app: apps/mobile\nunknown: 1\n',
      'apps/mobile/pubspec.yaml': FLUTTER_APP['pubspec.yaml'],
    });
    const result = await callTool('reis_mobile_detect', { dir: root });

    assert.equal(result.structuredContent.stack, 'flutter');
    assert.equal(result.structuredContent.projectConfig, join(root, '.reis-mobile/config.yaml'));
    assert.match(result.content[0].text, /^! .*unknown key "unknown" ignored/);
  });

  for (const [label, name, args, pattern] of [
    ['a missing directory', 'reis_mobile_detect', { dir: '/definitely/not/here' }, /Directory not found: \/definitely\/not\/here/],
    ['an unknown argument', 'reis_mobile_detect', { directory: '/tmp' }, /Unknown argument "directory".*Allowed: dir/],
    ['a wrong type', 'reis_mobile_doctor', { all: 'yes' }, /"all" must be a boolean/],
    ['an intent outside the vocabulary', 'reis_mobile_route', { intent: 'deploy-now' }, /"intent" must be one of: debug,/],
    ['a route with neither prompt nor intent', 'reis_mobile_route', { dir: '/tmp' }, /Pass a prompt, an intent, or both/],
    ['a read without a path', 'reis_mobile_read_instructions', {}, /"path" is required/],
  ]) {
    it(`returns a tool error for ${label}`, async () => {
      const result = await callTool(name, args);
      assert.equal(result.isError, true);
      assert.match(result.content[0].text, pattern);
    });
  }
});

describe('MCP tool: reis_mobile_read_instructions', () => {
  it('reads a skill by a path relative to the package, with the package root', async () => {
    const result = await callTool('reis_mobile_read_instructions', { path: 'skills/mobile-debug/SKILL.md' });

    assert.equal(result.isError, undefined);
    assert.match(result.content[0].text, /^File: .*skills\/mobile-debug\/SKILL\.md\nPackage root \(\$\{CLAUDE_PLUGIN_ROOT\}\): /);
    assert.match(result.content[0].text, /name: mobile-debug/);
  });

  it('reads the agent path a route returns, and the brief contract agents link to', async () => {
    const dir = await makeProject(FLUTTER_APP);
    const route = await callTool('reis_mobile_route', { dir, intent: 'review' });

    const agent = await callTool('reis_mobile_read_instructions', { path: route.structuredContent.agent.path });
    const brief = await callTool('reis_mobile_read_instructions', { path: 'docs/agent-context.md' });
    assert.match(agent.content[0].text, /name: mobile-code-reviewer/);
    assert.equal(brief.isError, undefined);
  });

  for (const [label, path] of [
    ['the package manifest', '../package.json'],
    ['a command file', 'commands/review.md'],
    ['the CLI source', join(PLUGIN_ROOT, 'bin/reis-mobile.mjs')],
    ['a directory', 'skills/mobile-debug'],
    ['a missing file', 'skills/mobile-debug/missing.md'],
  ]) {
    it(`refuses ${label}`, async () => {
      const result = await callTool('reis_mobile_read_instructions', { path });
      assert.equal(result.isError, true);
    });
  }

  it('refuses a file outside the package by absolute path', async () => {
    const dir = await makeProject({ 'secret.md': 'token' });
    const result = await callTool('reis_mobile_read_instructions', { path: join(dir, 'secret.md') });
    assert.equal(result.isError, true);
    assert.doesNotMatch(result.content[0].text, /token/);
  });
});

describe('MCP stdio transport', () => {
  async function exchange(messages) {
    const input = new PassThrough();
    const output = new PassThrough();
    let written = '';
    output.on('data', (chunk) => (written += chunk));
    const served = serveStdio({ version: '1', defaultDir: await makeProject(FLUTTER_APP), input, output });
    input.end(messages.map((message) => (typeof message === 'string' ? message : JSON.stringify(message))).join('\n') + '\n');
    await served;
    return written.trim().split('\n').map((line) => JSON.parse(line));
  }

  it('answers a parse error with a null id and keeps serving', async () => {
    const replies = await exchange(['{not json', request(1, 'ping')]);
    assert.deepEqual(replies.map((reply) => reply.id), [null, 1]);
    assert.equal(replies[0].error.code, ERROR_CODES.parse);
  });

  it('sends nothing for a cancelled request and still answers the next one', async () => {
    const replies = await exchange([
      request(1, 'initialize', { protocolVersion: LEGACY_VERSIONS[0] }),
      request(2, 'tools/call', { name: 'reis_mobile_doctor', arguments: {} }),
      { jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 2 } },
      request(3, 'ping'),
    ]);
    assert.deepEqual(replies.map((reply) => reply.id).sort(), [1, 3]);
  });

  it('writes only JSON-RPC lines to stdout from `reis-mobile mcp` and exits on end of input', async () => {
    const dir = await makeProject(FLUTTER_APP);
    const child = spawn(process.execPath, [BIN, 'mcp', '--dir', dir], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.stdin.end(
      [
        request(1, 'initialize', { protocolVersion: LEGACY_VERSIONS[0], capabilities: {} }),
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        request(2, 'tools/call', { name: 'reis_mobile_detect', arguments: {} }),
      ]
        .map((message) => JSON.stringify(message))
        .join('\n') + '\n',
    );
    const [code] = await once(child, 'exit');

    assert.equal(code, 0);
    assert.equal(stderr, '');
    const replies = stdout.trim().split('\n').map((line) => JSON.parse(line));
    assert.deepEqual(replies.map((reply) => reply.id).sort(), [1, 2]);
    assert.equal(replies.find((reply) => reply.id === 2).result.structuredContent.stack, 'flutter');
  });
});
