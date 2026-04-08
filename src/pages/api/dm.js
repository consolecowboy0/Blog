export const prerender = false;

import { getStore } from '@netlify/blobs';
import { requireAuth } from '../../lib/auth.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getIndex(store) {
  const data = await store.get('index', { type: 'json' });
  return data || { conversations: [] };
}

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { action } = body;
  const store = getStore('dm');

  // --- Public actions ---

  if (action === 'send') {
    const { visitor_id, text, fingerprint } = body;
    if (!visitor_id || !text) return json({ error: 'Missing fields' }, 400);
    if (text.length > 2000) return json({ error: 'Too long' }, 400);

    const key = `conv:${visitor_id}`;
    let conv = await store.get(key, { type: 'json' });

    if (!conv) {
      conv = {
        id: visitor_id,
        fingerprint: fingerprint || '',
        messages: [],
        created: Date.now(),
      };
    }

    conv.messages.push({ from: 'visitor', text, time: Date.now() });
    await store.setJSON(key, conv);

    const index = await getIndex(store);
    const existing = index.conversations.find(c => c.id === visitor_id);
    if (existing) {
      existing.preview = text.substring(0, 80);
      existing.time = Date.now();
      existing.unread = (existing.unread || 0) + 1;
    } else {
      index.conversations.push({
        id: visitor_id,
        preview: text.substring(0, 80),
        time: Date.now(),
        unread: 1,
      });
    }
    await store.setJSON('index', index);

    return json({ ok: true });
  }

  if (action === 'poll') {
    const { visitor_id } = body;
    if (!visitor_id) return json({ error: 'Missing visitor_id' }, 400);

    const key = `conv:${visitor_id}`;
    const conv = await store.get(key, { type: 'json' });
    if (!conv) return json({ messages: [] });
    return json({ messages: conv.messages });
  }

  // --- Admin actions (auth required) ---

  if (!requireAuth(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (action === 'list') {
    const index = await getIndex(store);
    index.conversations.sort((a, b) => b.time - a.time);
    return json(index);
  }

  if (action === 'read') {
    const { conversation_id } = body;
    if (!conversation_id) return json({ error: 'Missing conversation_id' }, 400);

    const key = `conv:${conversation_id}`;
    const conv = await store.get(key, { type: 'json' });
    if (!conv) return json({ error: 'Not found' }, 404);

    const index = await getIndex(store);
    const entry = index.conversations.find(c => c.id === conversation_id);
    if (entry) {
      entry.unread = 0;
      await store.setJSON('index', index);
    }

    return json(conv);
  }

  if (action === 'reply') {
    const { conversation_id, text } = body;
    if (!conversation_id || !text) return json({ error: 'Missing fields' }, 400);

    const key = `conv:${conversation_id}`;
    const conv = await store.get(key, { type: 'json' });
    if (!conv) return json({ error: 'Not found' }, 404);

    conv.messages.push({ from: 'admin', text, time: Date.now() });
    await store.setJSON(key, conv);

    const index = await getIndex(store);
    const entry = index.conversations.find(c => c.id === conversation_id);
    if (entry) {
      entry.preview = `You: ${text.substring(0, 75)}`;
      entry.time = Date.now();
      await store.setJSON('index', index);
    }

    return json({ ok: true });
  }

  if (action === 'delete') {
    const { conversation_id } = body;
    if (!conversation_id) return json({ error: 'Missing conversation_id' }, 400);

    await store.delete(`conv:${conversation_id}`);

    const index = await getIndex(store);
    index.conversations = index.conversations.filter(c => c.id !== conversation_id);
    await store.setJSON('index', index);

    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
