export const prerender = false;

import { getStore } from '@netlify/blobs';
import { requireAuth } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';

function unauthorized(corsHeaders) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: corsHeaders,
  });
}

export async function GET({ request }) {
  const corsHeaders = corsHeadersFor(request, 'GET, PUT, DELETE, OPTIONS');
  if (!requireAuth(request, 'legion')) return unauthorized(corsHeaders);

  const store = getStore('legion');
  const data = await store.get('session', { type: 'json' });

  return new Response(JSON.stringify(data || null), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB

export async function PUT({ request }) {
  const corsHeaders = corsHeadersFor(request, 'GET, PUT, DELETE, OPTIONS');
  if (!requireAuth(request, 'legion')) return unauthorized(corsHeaders);

  const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), {
      status: 413,
      headers: corsHeaders,
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

  const store = getStore('legion');
  await store.setJSON('session', body);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function DELETE({ request }) {
  const corsHeaders = corsHeadersFor(request, 'GET, PUT, DELETE, OPTIONS');
  if (!requireAuth(request, 'legion')) return unauthorized(corsHeaders);

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

export async function OPTIONS({ request }) {
  return preflight(request, 'GET, PUT, DELETE, OPTIONS');
}
