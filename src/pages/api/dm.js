export const prerender = false;

import { getDb } from '../../lib/firebase.js';
import { requireAuth } from '../../lib/auth.js';
import { getCorsHeaders } from '../../lib/cors.js';
import { FieldValue } from 'firebase-admin/firestore';

let _corsHeaders;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
  });
}

const ID_RE = /^[a-zA-Z0-9_-]+$/;

export async function POST({ request }) {
  _corsHeaders = getCorsHeaders(request);

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
    if (!visitor_id || typeof visitor_id !== 'string') return json({ error: 'Missing fields' }, 400);
    if (visitor_id.length > 128 || !ID_RE.test(visitor_id)) return json({ error: 'Invalid visitor_id' }, 400);
    if (!text || typeof text !== 'string') return json({ error: 'Missing fields' }, 400);
    if (text.length > 2000) return json({ error: 'Too long' }, 400);
    if (fingerprint && (typeof fingerprint !== 'string' || fingerprint.length > 256)) return json({ error: 'Invalid fingerprint' }, 400);

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

    // Send email notification
    const resendKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.NOTIFY_EMAIL || 'dustin.landers@gmail.com';
    if (resendKey) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'DM Inbox <dm@dustinlanders.com>',
          to: notifyEmail,
          subject: 'New DM on dustinlanders.com',
          text: `New message:\n\n${text}\n\nhttps://dustinlanders.com/dm/inbox`,
        }),
      }).then(r => r.json()).then(d => console.log('[resend]', JSON.stringify(d))).catch(e => console.error('[resend error]', e));
    }

    return json({ ok: true });
  }

  if (action === 'poll') {
    const { visitor_id } = body;
    if (!visitor_id || typeof visitor_id !== 'string') return json({ error: 'Missing visitor_id' }, 400);
    if (visitor_id.length > 128 || !ID_RE.test(visitor_id)) return json({ error: 'Invalid visitor_id' }, 400);

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
    if (!conversation_id || typeof conversation_id !== 'string') return json({ error: 'Missing conversation_id' }, 400);
    if (conversation_id.length > 128 || !ID_RE.test(conversation_id)) return json({ error: 'Invalid conversation_id' }, 400);

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
    if (!conversation_id || typeof conversation_id !== 'string' || !text) return json({ error: 'Missing fields' }, 400);
    if (conversation_id.length > 128 || !ID_RE.test(conversation_id)) return json({ error: 'Invalid conversation_id' }, 400);

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
    if (!conversation_id || typeof conversation_id !== 'string') return json({ error: 'Missing conversation_id' }, 400);
    if (conversation_id.length > 128 || !ID_RE.test(conversation_id)) return json({ error: 'Invalid conversation_id' }, 400);

    await convCol.doc(conversation_id).delete();
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
}

export async function OPTIONS({ request }) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}
