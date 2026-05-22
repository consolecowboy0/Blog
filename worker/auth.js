import { createHmac, randomBytes } from 'node:crypto';

const SECRET = process.env.AUTH_SECRET;
if (!SECRET) {
  console.error('[worker/auth] AUTH_SECRET env var is required. Exiting.');
  process.exit(1);
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function sign(payload) {
  return createHmac('sha256', SECRET).update(payload).digest('hex');
}

export function createToken(scope = 'legion') {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const nonce = randomBytes(8).toString('hex');
  const payload = Buffer.from(JSON.stringify({ scope, exp, nonce })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
