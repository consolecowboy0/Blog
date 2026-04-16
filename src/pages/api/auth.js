export const prerender = false;

import { verifyPassword, createToken } from '../../lib/auth.js';
import { getCorsHeaders } from '../../lib/cors.js';

export async function POST({ request }) {
  const cors = getCorsHeaders(request);
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: cors,
    });
  }

  const { password, scope } = body;

  if (!password || !scope) {
    return new Response(JSON.stringify({ error: 'Missing password or scope' }), {
      status: 400,
      headers: cors,
    });
  }

  if (!['legion', 'backend'].includes(scope)) {
    return new Response(JSON.stringify({ error: 'Invalid scope' }), {
      status: 400,
      headers: cors,
    });
  }

  if (!verifyPassword(password, scope)) {
    return new Response(JSON.stringify({ error: 'Wrong password' }), {
      status: 401,
      headers: cors,
    });
  }

  const token = createToken(scope);
  const secure = process.env.NODE_ENV !== 'development' ? '; Secure' : '';

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: {
      ...cors,
      'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${secure}`,
    },
  });
}

export async function OPTIONS({ request }) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}
