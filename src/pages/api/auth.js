export const prerender = false;

import { verifyPassword, createToken } from '../../lib/auth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST({ request }) {
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

  if (!['legion'].includes(scope)) {
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
      'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`,
    },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
