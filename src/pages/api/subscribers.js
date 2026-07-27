export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { getDb } from '../../lib/firebase.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

// Subscriber list management for the analytics dashboard. Reads/writes the same
// Firestore `subscribers` collection that the homepage subscribe form populates
// (see api/subscribe.js). Auth: scope "analytics".

const METHODS = 'GET, POST, PATCH, DELETE, OPTIONS';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Doc id derived from the email, matching api/subscribe.js so the homepage and
// the dashboard address the same documents.
function docIdFor(email) {
  return email.replace(/[^A-Za-z0-9_.-]/g, '_');
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

export async function GET({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, METHODS);
  if (!requireAuth(request, 'analytics')) return unauthorized(corsHeaders);
  const ip = clientAddress || 'unknown';
  const rl = checkRate(`subs-read:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return json({ error: 'Rate limited' }, 429, corsHeaders);

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

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, METHODS);
  if (!requireAuth(request, 'analytics')) return unauthorized(corsHeaders);
  const ip = clientAddress || 'unknown';
  const rl = checkRate(`subs-write:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return json({ error: 'Rate limited' }, 429, corsHeaders);

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
    return json({ ok: true, subscriber: { id: ref.id, email, created: now, source: 'manual' } }, 200, corsHeaders);
  } catch {
    return json({ error: 'Server error' }, 500, corsHeaders);
  }
}

export async function PATCH({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, METHODS);
  if (!requireAuth(request, 'analytics')) return unauthorized(corsHeaders);
  const ip = clientAddress || 'unknown';
  const rl = checkRate(`subs-write:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return json({ error: 'Rate limited' }, 429, corsHeaders);

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

    // Same document (case-only or trivial change): patch the email field in place.
    if (newId === id) {
      await oldRef.update({ email });
      return json({ ok: true, subscriber: { id, email, created: prev.created || 0, source: prev.source || '' } }, 200, corsHeaders);
    }

    // Email changed enough to move documents. Refuse to clobber an existing one.
    const newRef = db.collection('subscribers').doc(newId);
    if ((await newRef.get()).exists) return json({ error: 'That email already exists' }, 409, corsHeaders);
    await newRef.set({ ...prev, email });
    await oldRef.delete();
    return json({ ok: true, subscriber: { id: newId, email, created: prev.created || 0, source: prev.source || '' } }, 200, corsHeaders);
  } catch {
    return json({ error: 'Server error' }, 500, corsHeaders);
  }
}

export async function DELETE({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, METHODS);
  if (!requireAuth(request, 'analytics')) return unauthorized(corsHeaders);
  const ip = clientAddress || 'unknown';
  const rl = checkRate(`subs-write:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return json({ error: 'Rate limited' }, 429, corsHeaders);

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Missing id' }, 400, corsHeaders);
  if (id.length > 254 || !/^[A-Za-z0-9_.-]+$/.test(id)) {
    return json({ error: 'Invalid id' }, 400, corsHeaders);
  }

  try {
    const db = getDb();
    await db.collection('subscribers').doc(id).delete();
    return json({ ok: true }, 200, corsHeaders);
  } catch {
    return json({ error: 'Server error' }, 500, corsHeaders);
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, METHODS);
}
