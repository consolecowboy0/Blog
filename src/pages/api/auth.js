export const prerender = false;

import { verifyPassword, createToken } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  // Rate-limit: 5 attempts per 15 min per IP
  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRate(`auth:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Retry-After': String(rl.retryAfter) },
    });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { password, scope } = body;

  if (!password || !scope) {
    return new Response(JSON.stringify({ error: 'Missing password or scope' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!['legion', 'backend'].includes(scope)) {
    return new Response(JSON.stringify({ error: 'Invalid scope' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!verifyPassword(password, scope)) {
    return new Response(JSON.stringify({ error: 'Wrong password' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const token = createToken(scope);

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
    },
  });
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
