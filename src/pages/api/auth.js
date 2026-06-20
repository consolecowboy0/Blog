export const prerender = false;

import { verifyPassword, createToken } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';
import { clientIp, safeJson, rateLimited } from '../../lib/request.js';

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  const json = (data, status) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  // Reject non-JSON content types to block CSRF via form submissions.
  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }

  // Rate-limit: 5 attempts per 15 min per IP.
  const ip = clientIp(clientAddress);
  const rl = checkRate(`auth:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return rateLimited(rl.retryAfter, corsHeaders);

  const body = await safeJson(request, 1024);
  if (!body) return json({ error: 'Invalid or oversized request' }, 400);

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
      'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
    },
  });
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
