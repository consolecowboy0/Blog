export const prerender = false;

import { verifyPassword, createToken } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';
import { parseJsonBody } from '../../lib/body.js';

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  const json = (data, status) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }

  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRate(`auth:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) },
    });
  }

  const parsed = await parseJsonBody(request, 1024);
  if (parsed.error) return json({ error: parsed.error }, parsed.status);
  const body = parsed.data;

  const { password, scope } = body;

  if (!password || typeof password !== 'string' || password.length > 256) {
    return json({ error: 'Invalid password' }, 400);
  }

  if (!scope || typeof scope !== 'string') {
    return json({ error: 'Missing scope' }, 400);
  }

  if (!['analytics'].includes(scope)) {
    return json({ error: 'Invalid scope' }, 400);
  }

  if (!verifyPassword(password, scope)) {
    return json({ error: 'Wrong password' }, 401);
  }

  const token = createToken(scope);

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Set-Cookie': `__Host-auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
    },
  });
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
