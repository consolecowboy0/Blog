import { createHash, createHmac, randomBytes } from 'node:crypto';

if (!process.env.AUTH_SECRET) {
  console.warn('[auth] AUTH_SECRET env var not set. Tokens will not persist across deploys.');
}
const SECRET = process.env.AUTH_SECRET || 'legion-fallback-secret-set-AUTH_SECRET-in-env';

const HASHES = {
  legion: process.env.AUTH_HASH_LEGION || '48d5e01666b2a0cf736186d47e5e0e56e588fc2fbc24e598b0e849086bbcb846',
  backend: process.env.AUTH_HASH_LEGION || '48d5e01666b2a0cf736186d47e5e0e56e588fc2fbc24e598b0e849086bbcb846',
};

const TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days

function sign(payload) {
  return createHmac('sha256', SECRET).update(payload).digest('hex');
}

export function verifyPassword(password, scope) {
  const hash = HASHES[scope];
  if (!hash) return false;
  const attempt = createHash('sha256').update(password).digest('hex');
  return attempt === hash;
}

export function createToken(scope) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL;
  const payload = Buffer.from(JSON.stringify({ scope, exp })).toString('base64url');
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (sign(payload) !== sig) return null;
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

export function requireAuth(request) {
  const token = getTokenFromRequest(request);
  return verifyToken(token);
}
