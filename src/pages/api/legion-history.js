export const prerender = false;

import { getStore } from '@netlify/blobs';
import { requireAuth } from '../../lib/auth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: corsHeaders,
  });
}

async function purgeOld(store) {
  try {
    const { blobs } = await store.list({ prefix: 'history/' });
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    await Promise.all(
      (blobs || []).map(async (b) => {
        const ts = parseInt(b.key.split('/')[1], 10);
        if (!isNaN(ts) && ts < cutoff) {
          await store.delete(b.key);
        }
      })
    );
  } catch (e) {
    console.warn('[legion-history] purge failed:', e);
  }
}

export async function GET({ request }) {
  if (!requireAuth(request)) return unauthorized();

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const store = getStore('legion');

  await purgeOld(store);

  if (id) {
    const data = await store.get('history/' + id, { type: 'json' });
    return new Response(JSON.stringify(data || null), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { blobs } = await store.list({ prefix: 'history/' });
  const items = await Promise.all(
    (blobs || []).map(async (b) => {
      const data = await store.get(b.key, { type: 'json' });
      if (!data) return null;
      const blobId = b.key.split('/')[1];
      return {
        id: blobId,
        savedAt: parseInt(blobId, 10) || (data.lastModified || 0),
        opening: (data.opening || '').slice(0, 300),
        turnCount: (data.sessionTranscript || []).length,
        rounds: data.sessionRun || 0,
        agentNames: (data.sessionAgents || [])
          .map((a) => a && a.name)
          .filter((n) => n && n !== 'The Room'),
        roomName: data.roomStatus ? data.roomStatus.name : '',
      };
    })
  );
  const list = items.filter(Boolean).sort((a, b) => b.savedAt - a.savedAt);
  return new Response(JSON.stringify({ items: list }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function POST({ request }) {
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
  if (!body || !body.sessionTranscript || body.sessionTranscript.length === 0) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const store = getStore('legion');
  await purgeOld(store);
  const id = String(Date.now());
  await store.setJSON('history/' + id, body);
  return new Response(JSON.stringify({ ok: true, id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function DELETE({ request }) {
  if (!requireAuth(request)) return unauthorized();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), {
      status: 400,
      headers: corsHeaders,
    });
  }
  const store = getStore('legion');
  await store.delete('history/' + id);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
