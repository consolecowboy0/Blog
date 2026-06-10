export const prerender = false;

import { createHash } from 'node:crypto';
import { requireAuth } from '../../lib/auth.js';
import { getDb } from '../../lib/firebase.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';

const METHODS = 'GET, POST, PATCH, DELETE, OPTIONS';
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function docIdFor(email) {
  return createHash('sha256').update(email).digest('hex').slice(0, 32);
}

function normEmail(raw) {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function unauthorized(corsHeaders) {
  return json({ error: 'Unauthorized' }, 401, corsHeaders);
}

export async function GET({ request }) {
  const corsHeaders = corsHeadersFor(request, METHODS);
  if (!requireAuth(request, 'analytics')) return unauthorized(corsHeaders);

  try {
    const db = getDb();
    const snap = await db.collection('subscribers').get();
    const subscribers = snap.docs
      .map((d) => {
        const v = d.data();
        return { id: d.id, email: v.email || '', created: v.created || 0, source: v.source || '' };
      })
      .sort((a, b) => b.created - a.created || (a.email < b.email ? -1 : 1));
    return json({ subscribers, total: subscribers.length }, 200, corsHeaders);
  } catch {
    return json({ error: 'Server error' }, 500, corsHeaders);
  }
}

export async function POST({ request }) {
  const corsHeaders = corsHeadersFor(request, METHODS);
  if (!requireAuth(request, 'analytics')) return unauthorized(corsHeaders);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, corsHeaders); }

  const email = normEmail(body.email);
  if (!email) return json({ error: 'Invalid email' }, 400, corsHeaders);

  try {
    const db = getDb();
    const ref = db.collection('subscribers').doc(docIdFor(email));
    if ((await ref.get()).exists) return json({ error: 'Already on the list', already: true }, 409, corsHeaders);
    const now = Date.now();
    await ref.set({ email, created: now, source: 'manual' });
    console.log('[subscribers] ADD email=%s id=%s at=%d', email, ref.id, now);
    return json({ ok: true, subscriber: { id: ref.id, email, created: now, source: 'manual' } }, 200, corsHeaders);
  } catch {
    return json({ error: 'Server error' }, 500, corsHeaders);
  }
}

export async function PATCH({ request }) {
  const corsHeaders = corsHeadersFor(request, METHODS);
  if (!requireAuth(request, 'analytics')) return unauthorized(corsHeaders);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, corsHeaders); }

  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return json({ error: 'Missing id' }, 400, corsHeaders);
  const email = normEmail(body.email);
  if (!email) return json({ error: 'Invalid email' }, 400, corsHeaders);

  try {
    const db = getDb();
    const oldRef = db.collection('subscribers').doc(id);
    const oldDoc = await oldRef.get();
    if (!oldDoc.exists) return json({ error: 'Not found' }, 404, corsHeaders);

    const newId = docIdFor(email);
    const prev = oldDoc.data();

    if (newId === id) {
      await oldRef.update({ email });
      console.log('[subscribers] EDIT id=%s email=%s at=%d', id, email, Date.now());
      return json({ ok: true, subscriber: { id, email, created: prev.created || 0, source: prev.source || '' } }, 200, corsHeaders);
    }

    const newRef = db.collection('subscribers').doc(newId);
    if ((await newRef.get()).exists) return json({ error: 'That email already exists' }, 409, corsHeaders);
    await newRef.set({ ...prev, email });
    await oldRef.delete();
    console.log('[subscribers] EDIT id=%s->%s email=%s at=%d', id, newId, email, Date.now());
    return json({ ok: true, subscriber: { id: newId, email, created: prev.created || 0, source: prev.source || '' } }, 200, corsHeaders);
  } catch {
    return json({ error: 'Server error' }, 500, corsHeaders);
  }
}

export async function DELETE({ request }) {
  const corsHeaders = corsHeadersFor(request, METHODS);
  if (!requireAuth(request, 'analytics')) return unauthorized(corsHeaders);

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400, corsHeaders);
  if (id.length > 254 || !/^[A-Za-z0-9_.-]+$/.test(id)) {
    return json({ error: 'Invalid id' }, 400, corsHeaders);
  }

  try {
    const db = getDb();
    await db.collection('subscribers').doc(id).delete();
    console.log('[subscribers] DELETE id=%s at=%d', id, Date.now());
    return json({ ok: true }, 200, corsHeaders);
  } catch {
    return json({ error: 'Server error' }, 500, corsHeaders);
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, METHODS);
}
