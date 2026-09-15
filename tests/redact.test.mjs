import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { redactSecrets } from '../core/security/redact.mjs';

// Fake credentials are assembled at runtime so secret scanners (GitHub push protection,
// gitleaks) never see a provider-shaped literal in the repository.
const fake = (...parts) => parts.join('');

describe('redactSecrets', () => {
  for (const [label, input, expected] of [
    ['bearer headers', 'Authorization: Bearer abc.def-123', 'Authorization: Bearer ********'],
    ['quoted API keys in Dart', "+const apiKey = 'prod_value_1234567890';", "+const apiKey = '********';"],
    ['JSON secrets', '"client_secret": "a1b2c3d4e5f6"', '"client_secret": "********"'],
    ['.env lines in a diff', '+API_KEY=abcdef123456', '+API_KEY=********'],
    ['Android key.properties', 'storePassword=hunter2', 'storePassword=********'],
    ['Google API keys', `key ${fake('AI', 'za', 'SyA1234567890abcdefghijklmnopqrstuv')} end`, 'key ******** end'],
    ['GitHub tokens', `token ${fake('gh', 'p_', 'a'.repeat(36))}`, 'token ********'],
    ['AWS access keys', fake('AK', 'IA', 'ABCDEFGHIJKLMNOP'), '********'],
    ['JWTs', fake('ey', 'JhbGciOiJIUzI1NiJ9.', 'ey', 'JzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N'), '********'],
  ]) {
    it(`masks ${label}`, () => {
      assert.equal(redactSecrets(input), expected);
    });
  }

  it('masks private key blocks', () => {
    const input = `-----BEGIN RSA ${fake('PRIVATE', ' KEY')}-----\nMIIEow\nIBAAKCAQ\n-----END RSA ${fake('PRIVATE', ' KEY')}-----`;

    assert.equal(redactSecrets(input), '-----BEGIN PRIVATE KEY-----\n********\n-----END PRIVATE KEY-----');
  });

  it('keeps code that only references secrets readable', () => {
    const code = [
      "final token = await storage.read(key: 'token');",
      'headers: {"Authorization": authHeader},',
      'val password = binding.passwordInput.text',
    ].join('\n');

    assert.equal(redactSecrets(code), code);
  });
});
