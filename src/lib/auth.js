import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SECRET = process.env.AUTH_SECRET;
if (!SECRET) {
  throw new Error('[auth] AUTH_SECRET env var is required');
}

const HASHES = {
  analytics: process.env.AUTH_HASH_ANALYTICS,
};

const TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

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

export function verifyPassword(password, scope) {
  const stored = HASHES[scope];
  if (!stored) return false;

  // scrypt format: "scrypt:hex_salt:hex_derived_key"
  if (stored.startsWith('scrypt:')) {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    if (salt.length === 0 || expected.length !== SCRYPT_KEYLEN) return false;
    const derived = scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTS);
    return safeEqual(derived, expected);
  }

  // Legacy SHA-256 format (plain hex digest). Still supported but should be
  // migrated to scrypt using the generate-hash script.
  const attempt = createHash('sha256').update(password).digest('hex');
  return safeEqualHex(attempt, stored);
}

export function generateHash(password) {
  const salt = randomBytes(32);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTS);
  return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`;
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
