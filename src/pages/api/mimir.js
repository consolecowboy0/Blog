export const prerender = false;

import { createHash, randomBytes } from 'node:crypto';
import { getDb } from '../../lib/firebase.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';
import { FieldValue } from 'firebase-admin/firestore';

function hashSecret(raw) {
  return createHash('sha256').update(raw).digest('hex');
}

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');
  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { action } = body;
  const db = getDb();
  const convCol = db.collection('dm_conversations');

  if (action === 'send') {
    const { visitor_id, text, fingerprint, secret } = body;
    if (typeof visitor_id !== 'string' || typeof text !== 'string') {
      return json({ error: 'Missing fields' }, 400);
    }
    if (!visitor_id || !text) return json({ error: 'Missing fields' }, 400);
    if (visitor_id.length > 128 || !/^[A-Za-z0-9_-]+$/.test(visitor_id)) {
      return json({ error: 'Invalid visitor_id' }, 400);
    }
    if (text.length > 2000) return json({ error: 'Too long' }, 400);
    if (typeof secret !== 'string' || !secret) {
      return json({ error: 'Missing secret' }, 400);
    }

    const rlIp = checkRate(`mimir-send:${ip}`, 10, 5 * 60 * 1000);
    if (!rlIp.ok) return json({ error: 'Rate limited' }, 429);
    const rlVis = checkRate(`mimir-send:${visitor_id}`, 20, 10 * 60 * 1000);
    if (!rlVis.ok) return json({ error: 'Rate limited' }, 429);

    const docRef = convCol.doc(visitor_id);
    const doc = await docRef.get();
    const now = Date.now();
    const secretHash = hashSecret(secret);

    let fp = '';
    if (fingerprint && typeof fingerprint === 'string') {
      fp = fingerprint.slice(0, 512);
    } else if (fingerprint && typeof fingerprint === 'object') {
      try { fp = JSON.stringify(fingerprint).slice(0, 512); } catch { fp = ''; }
    }

    if (doc.exists) {
      const stored = doc.data().secretHash;
      if (stored && stored !== secretHash) {
        return json({ error: 'Forbidden' }, 403);
      }
      const update = {
        messages: FieldValue.arrayUnion({ from: 'visitor', text, time: now }),
        preview: text.substring(0, 80),
        updated: now,
        unread: FieldValue.increment(1),
        ...(fp ? { fingerprint: fp } : {}),
      };
      if (!stored) update.secretHash = secretHash;
      await docRef.update(update);
    } else {
      await docRef.set({
        id: visitor_id,
        secretHash,
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
    const { visitor_id, secret } = body;
    if (typeof visitor_id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(visitor_id) || visitor_id.length > 128) {
      return json({ error: 'Invalid visitor_id' }, 400);
    }
    if (typeof secret !== 'string' || !secret) {
      return json({ error: 'Missing secret' }, 400);
    }

    const rl = checkRate(`mimir-poll:${ip}:${visitor_id}`, 30, 60 * 1000);
    if (!rl.ok) return json({ error: 'Rate limited' }, 429);

    const doc = await convCol.doc(visitor_id).get();
    if (!doc.exists) return json({ messages: [] });

    const stored = doc.data().secretHash;
    if (stored && stored !== hashSecret(secret)) {
      return json({ error: 'Forbidden' }, 403);
    }

    return json({ messages: doc.data().messages || [] });
  }

  return json({ error: 'Unknown action' }, 400);
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
