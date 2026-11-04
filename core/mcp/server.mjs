import { once } from 'node:events';
import { createInterface } from 'node:readline';

import { callTool, hasTool, listTools } from './tools.mjs';

// A dual-era MCP server. Modern clients (2026-07-28) send the protocol version and their
// capabilities in every request's `_meta` and may probe with `server/discover`; legacy clients
// (2025-11-25 and earlier) open with an `initialize` handshake. Both are served on one process.
export const MODERN_VERSIONS = ['2026-07-28'];
export const LEGACY_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const SUPPORTED_VERSIONS = [...MODERN_VERSIONS, ...LEGACY_VERSIONS];

const META_VERSION = 'io.modelcontextprotocol/protocolVersion';
const META_CAPABILITIES = 'io.modelcontextprotocol/clientCapabilities';
const META_SERVER_INFO = 'io.modelcontextprotocol/serverInfo';

export const ERROR_CODES = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
  unsupportedVersion: -32022,
};

const CAPABILITIES = { tools: {} };

const INSTRUCTIONS =
  'reis-mobile prepares context for Flutter, native Android, native iOS, React Native/Expo and Kotlin Multiplatform apps. ' +
  'Call reis_mobile_route, or reis_mobile_review, reis_mobile_debug, reis_mobile_test or reis_mobile_release for those tasks, ' +
  'with the app directory as "dir". Then read the returned agent and skill files with reis_mobile_read_instructions and follow them; ' +
  'open only the references that match the stack and the task. Every tool is read-only and offline: none edits the project, ' +
  'builds, runs tests or calls a network service.';

class RpcError extends Error {
  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

/**
 * Handles one decoded JSON-RPC message and resolves to the response, or to null for a
 * notification. It never rejects: every failure becomes a JSON-RPC error or a tool error.
 */
export function createMcpServer({ version, defaultDir = process.cwd() }) {
  const serverInfo = { name: 'reis-mobile', title: 'reis-mobile', version };
  // Set by `initialize`: from then on, requests without `_meta` follow that legacy revision.
  let legacyVersion = null;

  async function handle(message) {
    if (typeof message !== 'object' || message === null || Array.isArray(message)) {
      return failure(null, new RpcError(ERROR_CODES.invalidRequest, 'Expected one JSON-RPC 2.0 message object; batches are not supported.'));
    }
    const isRequest = Object.hasOwn(message, 'id');
    if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
      return isRequest ? failure(requestId(message.id), new RpcError(ERROR_CODES.invalidRequest, 'Expected a JSON-RPC 2.0 request with a method.')) : null;
    }
    // notifications/initialized needs no reply; cancellation is handled by the transport.
    if (!isRequest) return null;

    const { id, method, params } = message;
    if (requestId(id) === null) return failure(null, new RpcError(ERROR_CODES.invalidRequest, 'The request id must be a string or a number.'));
    try {
      if (params !== undefined && (typeof params !== 'object' || params === null || Array.isArray(params))) {
        throw new RpcError(ERROR_CODES.invalidParams, 'params must be an object.');
      }
      if (method === 'initialize') return success(id, initialize(params ?? {}));

      const modern = isModernRequest(method, params);
      const result = await dispatch(method, params ?? {}, modern);
      return success(id, modern ? { resultType: 'complete', ...result, _meta: { [META_SERVER_INFO]: serverInfo } } : result);
    } catch (error) {
      return failure(id, error instanceof RpcError ? error : new RpcError(ERROR_CODES.internal, `Internal error: ${error.message}`));
    }
  }

  function initialize(params) {
    const requested = params.protocolVersion;
    legacyVersion = LEGACY_VERSIONS.includes(requested) ? requested : LEGACY_VERSIONS[0];
    return { protocolVersion: legacyVersion, capabilities: CAPABILITIES, serverInfo, instructions: INSTRUCTIONS };
  }

  /** A request is modern when it carries a protocol version in `_meta`; legacy once initialized. */
  function isModernRequest(method, params) {
    const meta = params?._meta;
    const requested = meta?.[META_VERSION];
    if (requested !== undefined) {
      if (!MODERN_VERSIONS.includes(requested)) {
        throw new RpcError(ERROR_CODES.unsupportedVersion, 'Unsupported protocol version', { supported: SUPPORTED_VERSIONS, requested });
      }
      const capabilities = meta[META_CAPABILITIES];
      if (typeof capabilities !== 'object' || capabilities === null || Array.isArray(capabilities)) {
        throw new RpcError(ERROR_CODES.invalidParams, `Missing _meta["${META_CAPABILITIES}"]: every ${requested} request carries the client capabilities.`);
      }
      return true;
    }
    if (legacyVersion || method === 'ping') return false;
    throw new RpcError(
      ERROR_CODES.invalidParams,
      `Missing _meta["${META_VERSION}"]. Send initialize first (protocol ${LEGACY_VERSIONS[0]} and earlier) or include the per-request _meta of ${MODERN_VERSIONS[0]}.`,
      { supported: SUPPORTED_VERSIONS },
    );
  }

  async function dispatch(method, params, modern) {
    switch (method) {
      case 'server/discover':
        if (!modern) break;
        return { supportedVersions: MODERN_VERSIONS, capabilities: CAPABILITIES, instructions: INSTRUCTIONS };
      case 'ping':
        return {};
      case 'tools/list':
        return { tools: listTools() };
      case 'tools/call': {
        const { name, arguments: args } = params;
        if (typeof name !== 'string' || !hasTool(name)) throw new RpcError(ERROR_CODES.invalidParams, `Unknown tool: ${name}`);
        if (args !== undefined && (typeof args !== 'object' || args === null || Array.isArray(args))) {
          throw new RpcError(ERROR_CODES.invalidParams, 'tools/call arguments must be an object.');
        }
        return callTool(name, args ?? {}, { defaultDir });
      }
    }
    throw new RpcError(ERROR_CODES.methodNotFound, `Method not found: ${method}`);
  }

  return { handle };
}

/**
 * Serves newline-delimited JSON-RPC over stdio until the input closes. Only protocol messages
 * are written to `output`; a cancelled request gets no reply, as the transport requires.
 */
export async function serveStdio({ version, defaultDir, input = process.stdin, output = process.stdout }) {
  const server = createMcpServer({ version, defaultDir });
  const inFlight = new Set();
  const cancelled = new Set();
  const pending = new Set();
  const lines = createInterface({ input, crlfDelay: Infinity });

  const write = (message) => {
    if (!output.writableEnded && !output.destroyed) output.write(`${JSON.stringify(message)}\n`);
  };
  // The client closing its end mid-reply is a shutdown, not a crash.
  output.on('error', () => lines.close());

  lines.on('line', (line) => {
    if (!line.trim()) return;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      write(failure(null, new RpcError(ERROR_CODES.parse, 'Parse error: each line must be one JSON-RPC message.')));
      return;
    }
    if (message?.method === 'notifications/cancelled') {
      const target = message.params?.requestId;
      if (inFlight.has(target)) cancelled.add(target);
      return;
    }

    const id = Object.hasOwn(message ?? {}, 'id') ? message.id : undefined;
    if (id !== undefined) inFlight.add(id);
    const task = server.handle(message).then((response) => {
      inFlight.delete(id);
      if (cancelled.delete(id) || !response) return;
      write(response);
    });
    pending.add(task);
    task.finally(() => pending.delete(task));
  });

  await once(lines, 'close');
  await Promise.allSettled([...pending]);
}

function requestId(id) {
  return typeof id === 'string' || typeof id === 'number' ? id : null;
}

function success(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function failure(id, error) {
  return { jsonrpc: '2.0', id, error: { code: error.code, message: error.message, ...(error.data !== undefined && { data: error.data }) } };
}
