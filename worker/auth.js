// Mirrors src/lib/auth.js token format so the worker can mint its own bearer tokens
// using the same AUTH_SECRET the Astro site uses. Keeping this file self-contained
// lets the worker be deployed independently without pulling in the Astro project.
import { createHmac } from 'node:crypto';

if (!process.env.AUTH_SECRET) {
  throw new Error('[worker/auth] AUTH_SECRET env var is required');
}
const SECRET = process.env.AUTH_SECRET;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function sign(payload) {
  return createHmac('sha256', SECRET).update(payload).digest('hex');
}

export function createToken(scope = 'legion') {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ scope, exp })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
