export const prerender = false;

import { getDb } from '../../lib/firebase.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';
import { readJsonBody } from '../../lib/body.js';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');
  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const parsed = await readJsonBody(request, 4096);
  if (parsed.error) return json({ error: parsed.error }, parsed.status);
  const body = parsed.data;

  const { action } = body;
  const db = getDb();
  const convCol = db.collection('dm_conversations');

  if (action === 'send') {
    const { visitor_id, text, fingerprint } = body;
    if (typeof visitor_id !== 'string' || typeof text !== 'string') {
      return json({ error: 'Missing fields' }, 400);
    }
    if (!visitor_id || !text) return json({ error: 'Missing fields' }, 400);
    if (visitor_id.length > 128 || !/^[A-Za-z0-9_-]+$/.test(visitor_id)) {
      return json({ error: 'Invalid visitor_id' }, 400);
    }
    if (text.length > 2000) return json({ error: 'Too long' }, 400);

    const rlIp = checkRate(`mimir-send:${ip}`, 10, 5 * 60 * 1000);
    if (!rlIp.ok) return json({ error: 'Rate limited' }, 429);
    const rlVis = checkRate(`mimir-send:${visitor_id}`, 20, 10 * 60 * 1000);
    if (!rlVis.ok) return json({ error: 'Rate limited' }, 429);

    const docRef = convCol.doc(visitor_id);
    const doc = await docRef.get();
    const now = Date.now();

    let fp = '';
    if (fingerprint && typeof fingerprint === 'string') {
      fp = fingerprint.slice(0, 512);
    } else if (fingerprint && typeof fingerprint === 'object') {
      try { fp = JSON.stringify(fingerprint).slice(0, 512); } catch { fp = ''; }
    }

    if (doc.exists) {
      await docRef.update({
        messages: FieldValue.arrayUnion({ from: 'visitor', text, time: now }),
        preview: text.substring(0, 80),
        updated: now,
        unread: FieldValue.increment(1),
        ...(fp ? { fingerprint: fp } : {}),
      });
    } else {
      await docRef.set({
        id: visitor_id,
        fingerprint: fp,
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
    if (typeof visitor_id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(visitor_id) || visitor_id.length > 128) {
      return json({ error: 'Invalid visitor_id' }, 400);
    }

    const rl = checkRate(`mimir-poll:${ip}:${visitor_id}`, 30, 60 * 1000);
    if (!rl.ok) return json({ error: 'Rate limited' }, 429);
    const rlVid = checkRate(`mimir-poll:${visitor_id}`, 60, 60 * 1000);
    if (!rlVid.ok) return json({ error: 'Rate limited' }, 429);

    const doc = await convCol.doc(visitor_id).get();
    if (!doc.exists) return json({ messages: [] });
    return json({ messages: doc.data().messages || [] });
  }

  return json({ error: 'Unknown action' }, 400);
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
