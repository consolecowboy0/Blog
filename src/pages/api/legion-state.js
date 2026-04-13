export const prerender = false;

import { getStore } from '@netlify/blobs';
import { requireAuth } from '../../lib/auth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: corsHeaders,
  });
}

export async function GET({ request }) {
  if (!requireAuth(request)) return unauthorized();

  const store = getStore('legion');
  const data = await store.get('session', { type: 'json' });

  return new Response(JSON.stringify(data || null), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function PUT({ request }) {
  if (!requireAuth(request)) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const store = getStore('legion');
  await store.setJSON('session', body);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function DELETE({ request }) {
  if (!requireAuth(request)) return unauthorized();

  const store = getStore('legion');
  // Archive current session to history before deleting, if it has content
  try {
    const current = await store.get('session', { type: 'json' });
    if (current && current.sessionTranscript && current.sessionTranscript.length > 0) {
      const id = String(Date.now());
      await store.setJSON('history/' + id, current);
    }
  } catch (e) {
    console.warn('[legion-state] archive on delete failed:', e);
  }
  await store.delete('session');

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
