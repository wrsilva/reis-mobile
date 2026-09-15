import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { redactSecrets } from '../core/security/redact.mjs';

describe('redactSecrets', () => {
  for (const [label, input, expected] of [
    ['bearer headers', 'Authorization: Bearer abc.def-123', 'Authorization: Bearer ********'],
    ['quoted API keys in Dart', "+const apiKey = 'sk_live_1234567890';", "+const apiKey = '********';"],
    ['JSON secrets', '"client_secret": "a1b2c3d4e5f6"', '"client_secret": "********"'],
    ['.env lines in a diff', '+API_KEY=abcdef123456', '+API_KEY=********'],
    ['Android key.properties', 'storePassword=hunter2', 'storePassword=********'],
    ['Google API keys', 'key AIzaSyA1234567890abcdefghijklmnopqrstuv end', 'key ******** end'],
    ['GitHub tokens', `token ghp_${'a'.repeat(36)}`, 'token ********'],
    ['AWS access keys', 'AKIAABCDEFGHIJKLMNOP', '********'],
    ['JWTs', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N', '********'],
  ]) {
    it(`masks ${label}`, () => {
      assert.equal(redactSecrets(input), expected);
    });
  }

  it('masks private key blocks', () => {
    const input = '-----BEGIN RSA PRIVATE KEY-----\nMIIEow\nIBAAKCAQ\n-----END RSA PRIVATE KEY-----';

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
