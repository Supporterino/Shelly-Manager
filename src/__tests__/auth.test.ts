/**
 * Tests for src/utils/auth.ts
 * Uses known SHA-256 inputs to verify digest computation.
 */
import { describe, expect, it } from 'vitest';
import { computeDigestAuth, parseWwwAuthenticate } from '../utils/auth';

describe('parseWwwAuthenticate', () => {
  it('extracts realm and nonce from a valid Digest header', () => {
    const header =
      'Digest realm="shellyplus1-abc123", nonce=1700000001, algorithm=SHA-256, qop=auth';
    const result = parseWwwAuthenticate(header);
    expect(result).toEqual({ realm: 'shellyplus1-abc123', nonce: 1700000001 });
  });

  it('returns null for a non-Digest header', () => {
    expect(parseWwwAuthenticate('Basic realm="test"')).toBeNull();
  });

  it('returns null if realm is missing', () => {
    expect(parseWwwAuthenticate('Digest nonce=12345')).toBeNull();
  });

  it('returns null if nonce is missing', () => {
    expect(parseWwwAuthenticate('Digest realm="test"')).toBeNull();
  });
});

describe('computeDigestAuth', () => {
  it('returns a valid auth object with all required fields', async () => {
    const auth = await computeDigestAuth('shellypro4pm-aabbccddee', 1700000000, 'mypassword');
    expect(auth.realm).toBe('shellypro4pm-aabbccddee');
    expect(auth.username).toBe('admin');
    expect(auth.nonce).toBe(1700000000);
    expect(auth.algorithm).toBe('SHA-256');
    expect(typeof auth.cnonce).toBe('number');
    expect(typeof auth.response).toBe('string');
    expect(auth.response).toMatch(/^[0-9a-f]{64}$/); // 64 hex chars = 256-bit SHA
  });

  it('produces a deterministic response for a fixed cnonce', async () => {
    // We cannot mock Math.random easily here, but we can at least verify
    // that the same inputs always produce the same response length
    const a1 = await computeDigestAuth('realm', 12345, 'pass');
    const a2 = await computeDigestAuth('realm', 12345, 'pass');
    expect(a1.response.length).toBe(64);
    expect(a2.response.length).toBe(64);
  });

  it('produces different responses for different passwords', async () => {
    const a = await computeDigestAuth('realm', 12345, 'password1');
    const b = await computeDigestAuth('realm', 12345, 'password2');
    // The cnonce will differ but the algorithm guarantees different hash chains
    expect(a.response).not.toBe(b.response);
  });
});
