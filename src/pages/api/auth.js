export const prerender = false;

import { verifyPassword, createToken } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

const VALID_SCOPES = ['analytics', 'legion'];

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');
  const json = (data, status, extra) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extra },
    });

  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRate(`auth:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return json({ error: 'Too many attempts. Try again later.' }, 429, { 'Retry-After': String(rl.retryAfter) });
  }

  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { password, scope } = body;

  if (!password || typeof password !== 'string' || !scope || typeof scope !== 'string') {
    return json({ error: 'Missing password or scope' }, 400);
  }

  if (password.length > 256) {
    return json({ error: 'Invalid credentials' }, 400);
  }

  if (!VALID_SCOPES.includes(scope)) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  if (!verifyPassword(password, scope)) {
    return json({ error: 'Invalid credentials' }, 401);
  }

  const token = createToken(scope);

  return json({ token }, 200, {
    'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
  });
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
