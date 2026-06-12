export const prerender = false;

import { verifyPassword, createToken } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  // Rate-limit: 5 attempts per 15 min per IP
  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRate(`auth:${ip}`, 5, 15 * 60 * 1000);
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
      status: 429,
      headers: { ...jsonHeaders, 'Retry-After': String(rl.retryAfter) },
    });
  }

  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
      status: 415, headers: jsonHeaders,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: jsonHeaders,
    });
  }

  const { password, scope } = body;

  if (typeof password !== 'string' || typeof scope !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing password or scope' }), {
      status: 400, headers: jsonHeaders,
    });
  }

  if (!password || !scope) {
    return new Response(JSON.stringify({ error: 'Missing password or scope' }), {
      status: 400, headers: jsonHeaders,
    });
  }

  if (!['analytics'].includes(scope)) {
    return new Response(JSON.stringify({ error: 'Invalid scope' }), {
      status: 400, headers: jsonHeaders,
    });
  }

  if (!verifyPassword(password, scope)) {
    return new Response(JSON.stringify({ error: 'Wrong password' }), {
      status: 401, headers: jsonHeaders,
    });
  }

  const token = createToken(scope);

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: {
      ...jsonHeaders,
      'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
    },
  });
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
