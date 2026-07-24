import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { createHash } from 'node:crypto';

// auth.js reads AUTH_SECRET and AUTH_HASH_ANALYTICS at import time, so env must
// be set before the module loads. We set it here and import dynamically.
const PASSWORD = 'correct horse battery staple';

let auth;

beforeAll(async () => {
  process.env.AUTH_SECRET = 'test-secret-do-not-use-in-prod';
  process.env.AUTH_HASH_ANALYTICS = createHash('sha256').update(PASSWORD).digest('hex');
  auth = await import('../src/lib/auth.js');
});

afterEach(() => {
  vi.useRealTimers();
});

function reqWith(headers) {
  return { headers: new Headers(headers) };
}

describe('verifyPassword', () => {
  it('accepts the correct password for a known scope', () => {
    expect(auth.verifyPassword(PASSWORD, 'analytics')).toBe(true);
  });

  it('rejects a wrong password', () => {
    expect(auth.verifyPassword('nope', 'analytics')).toBe(false);
  });

  it('rejects an unknown scope', () => {
    expect(auth.verifyPassword(PASSWORD, 'nonexistent')).toBe(false);
  });
});

describe('createToken / verifyToken', () => {
  it('round-trips a token and returns the payload', () => {
    const token = auth.createToken('analytics');
    const data = auth.verifyToken(token);
    expect(data).toMatchObject({ scope: 'analytics' });
    expect(typeof data.exp).toBe('number');
    expect(typeof data.nonce).toBe('string');
  });

  it('returns null for null / non-string input', () => {
    expect(auth.verifyToken(null)).toBeNull();
    expect(auth.verifyToken(undefined)).toBeNull();
    expect(auth.verifyToken(123)).toBeNull();
  });

  it('returns null for a malformed token (wrong part count)', () => {
    expect(auth.verifyToken('onlyonepart')).toBeNull();
    expect(auth.verifyToken('a.b.c')).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const token = auth.createToken('analytics');
    const [payload, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ scope: 'analytics', exp: 9999999999, nonce: 'x' }))
      .toString('base64url');
    expect(auth.verifyToken(`${forged}.${sig}`)).toBeNull();
    // Original still valid as a control.
    expect(auth.verifyToken(`${payload}.${sig}`)).not.toBeNull();
  });

  it('rejects a tampered signature', () => {
    const token = auth.createToken('analytics');
    const [payload] = token.split('.');
    const badSig = 'deadbeef'.repeat(8);
    expect(auth.verifyToken(`${payload}.${badSig}`)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = auth.createToken('analytics');
    // Jump past the 7-day TTL.
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000);
    expect(auth.verifyToken(token)).toBeNull();
  });
});

describe('getTokenFromRequest', () => {
  it('reads a Bearer authorization header', () => {
    const req = reqWith({ Authorization: 'Bearer abc.def' });
    expect(auth.getTokenFromRequest(req)).toBe('abc.def');
  });

  it('reads the auth_token cookie', () => {
    const req = reqWith({ Cookie: 'other=1; auth_token=xyz.123; more=2' });
    expect(auth.getTokenFromRequest(req)).toBe('xyz.123');
  });

  it('prefers the Bearer header over the cookie', () => {
    const req = reqWith({ Authorization: 'Bearer bearer.tok', Cookie: 'auth_token=cookie.tok' });
    expect(auth.getTokenFromRequest(req)).toBe('bearer.tok');
  });

  it('returns null when neither is present', () => {
    expect(auth.getTokenFromRequest(reqWith({}))).toBeNull();
  });
});

describe('requireAuth', () => {
  it('returns payload for a valid token with matching scope', () => {
    const token = auth.createToken('analytics');
    const req = reqWith({ Authorization: `Bearer ${token}` });
    expect(auth.requireAuth(req, 'analytics')).toMatchObject({ scope: 'analytics' });
  });

  it('returns null for a scope mismatch', () => {
    const token = auth.createToken('analytics');
    const req = reqWith({ Authorization: `Bearer ${token}` });
    expect(auth.requireAuth(req, 'other')).toBeNull();
  });

  it('returns null when no token is present', () => {
    expect(auth.requireAuth(reqWith({}), 'analytics')).toBeNull();
  });
});
