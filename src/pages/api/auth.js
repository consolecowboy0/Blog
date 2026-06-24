export const prerender = false;

import { verifyPassword, createToken } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';
import { safeIp, parseJsonBody } from '../../lib/request.js';

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  const json = (data, status) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });

  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }

  const ip = safeIp(clientAddress);
  const rl = checkRate(`auth:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Retry-After': String(rl.retryAfter) },
    });
  }

  const parsed = await parseJsonBody(request, 1024);
  if (parsed.error) return json({ error: parsed.error }, parsed.status);
  const body = parsed.body;

  const { password, scope } = body;

  if (!password || !scope) {
    return json({ error: 'Missing password or scope' }, 400);
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
      'Cache-Control': 'no-store',
      'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
    },
  });
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
