import { createHash, createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const SECRET = process.env.AUTH_SECRET;
if (!SECRET) {
  throw new Error('[auth] AUTH_SECRET env var is required');
}

const HASHES = {
  analytics: process.env.AUTH_HASH_ANALYTICS,
};

const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha256';

const TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days

function sign(payload) {
  return createHmac('sha256', SECRET).update(payload).digest('hex');
}

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

function safeEqual(a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b) || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function verifyPbkdf2(password, stored) {
  const [, iterStr, salt, hash] = stored.split(':');
  const iterations = parseInt(iterStr, 10);
  if (!iterations || !salt || !hash) return false;
  const derived = pbkdf2Sync(password, Buffer.from(salt, 'hex'), iterations, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  return safeEqual(derived, Buffer.from(hash, 'hex'));
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = pbkdf2Sync(password, Buffer.from(salt, 'hex'), PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${salt}:${derived.toString('hex')}`;
}

export function verifyPassword(password, scope) {
  const hash = HASHES[scope];
  if (!hash) return false;
  if (hash.startsWith('pbkdf2:')) return verifyPbkdf2(password, hash);
  const attempt = createHash('sha256').update(password).digest('hex');
  return safeEqualHex(attempt, hash);
}

export function createToken(scope) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL;
  const nonce = randomBytes(8).toString('hex');
  const payload = Buffer.from(JSON.stringify({ scope, exp, nonce })).toString('base64url');
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request) {
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  return match ? match[1] : null;
}

export function requireAuth(request, scope) {
  const token = getTokenFromRequest(request);
  const data = verifyToken(token);
  if (!data) return null;
  if (scope && data.scope !== scope) return null;
  return data;
}
