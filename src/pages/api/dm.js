export const prerender = false;

import { getDb } from '../../lib/firebase.js';
import { requireAuth } from '../../lib/auth.js';
import { FieldValue } from 'firebase-admin/firestore';

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

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { action } = body;
  const db = getDb();
  const convCol = db.collection('dm_conversations');

  // --- Public actions ---

  if (action === 'send') {
    const { visitor_id, text, fingerprint } = body;
    if (!visitor_id || !text) return json({ error: 'Missing fields' }, 400);
    if (text.length > 2000) return json({ error: 'Too long' }, 400);

    const docRef = convCol.doc(visitor_id);
    const doc = await docRef.get();
    const now = Date.now();

    if (doc.exists) {
      await docRef.update({
        messages: FieldValue.arrayUnion({ from: 'visitor', text, time: now }),
        preview: text.substring(0, 80),
        updated: now,
        unread: FieldValue.increment(1),
        ...(fingerprint ? { fingerprint } : {}),
      });
    } else {
      await docRef.set({
        id: visitor_id,
        fingerprint: fingerprint || '',
        messages: [{ from: 'visitor', text, time: now }],
        preview: text.substring(0, 80),
        created: now,
        updated: now,
        unread: 1,
      });
    }

    return json({ ok: true });
  }

  if (action === 'poll') {
    const { visitor_id } = body;
    if (!visitor_id) return json({ error: 'Missing visitor_id' }, 400);

    const doc = await convCol.doc(visitor_id).get();
    if (!doc.exists) return json({ messages: [] });
    return json({ messages: doc.data().messages || [] });
  }

  // --- Admin actions (auth required) ---

  if (!requireAuth(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (action === 'list') {
    const snapshot = await convCol.orderBy('updated', 'desc').get();
    const conversations = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: d.id,
        preview: d.preview || '',
        time: d.updated || d.created,
        unread: d.unread || 0,
      };
    });
    return json({ conversations });
  }

  if (action === 'read') {
    const { conversation_id } = body;
    if (!conversation_id) return json({ error: 'Missing conversation_id' }, 400);

    const docRef = convCol.doc(conversation_id);
    const doc = await docRef.get();
    if (!doc.exists) return json({ error: 'Not found' }, 404);

    // Mark read
    await docRef.update({ unread: 0 });

    const data = doc.data();
    return json({
      id: data.id,
      fingerprint: data.fingerprint || '',
      messages: data.messages || [],
    });
  }

  if (action === 'reply') {
    const { conversation_id, text } = body;
    if (!conversation_id || !text) return json({ error: 'Missing fields' }, 400);

    const docRef = convCol.doc(conversation_id);
    const doc = await docRef.get();
    if (!doc.exists) return json({ error: 'Not found' }, 404);

    const now = Date.now();
    await docRef.update({
      messages: FieldValue.arrayUnion({ from: 'admin', text, time: now }),
      preview: `You: ${text.substring(0, 75)}`,
      updated: now,
    });

    return json({ ok: true });
  }

  if (action === 'delete') {
    const { conversation_id } = body;
    if (!conversation_id) return json({ error: 'Missing conversation_id' }, 400);

    await convCol.doc(conversation_id).delete();
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
