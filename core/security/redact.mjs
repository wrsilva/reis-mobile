const MASK = '********';

// Patterns target literal secrets, not identifiers: `final token = await read()` must stay
// readable in a code review, while `apiKey = "AIza..."` must not leak to a model.
const RULES = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, `-----BEGIN PRIVATE KEY-----\n${MASK}\n-----END PRIVATE KEY-----`],
  [/(authorization["']?\s*[:=]\s*["']?(?:bearer|basic|token)\s+)[^\s"'`]+/gi, `$1${MASK}`],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, MASK],
  [/\bAKIA[0-9A-Z]{16}\b/g, MASK],
  [/\bAIza[0-9A-Za-z_-]{35}\b/g, MASK],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, MASK],
  [/\bsk-[A-Za-z0-9_-]{20,}\b/g, MASK],
  // apiKey = "…", "client_secret": "…", password: '…'
  [/(\b[\w.-]*(?:password|passwd|secret|token|api[_-]?key|private[_-]?key|access[_-]?key)[\w.-]*["']?\s*[:=]\s*)(["'])([^"'\n]{8,})\2/gi, `$1$2${MASK}$2`],
  // .env / gradle.properties / key.properties: API_KEY=…, storePassword=…
  [/^([+\- ]?\s*(?:export\s+)?[A-Z0-9_]*(?:PASSWORD|SECRET|TOKEN|API_KEY|APIKEY|PRIVATE_KEY|ACCESS_KEY)[A-Z0-9_]*\s*=\s*)\S+/gm, `$1${MASK}`],
  [/^([+\- ]?\s*\w*[Pp]assword\s*=\s*)\S+/gm, `$1${MASK}`],
];

export function redactSecrets(text) {
  let result = String(text ?? '');
  for (const [pattern, replacement] of RULES) result = result.replace(pattern, replacement);
  return result;
}
