export const prerender = false;

import { createHash } from 'node:crypto';
import { getDb } from '../../lib/firebase.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');
  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  let { email } = body;
  if (typeof email !== 'string') return json({ error: 'Missing email' }, 400);
  email = email.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ error: 'Invalid email' }, 400);
  }

  const rl = checkRate(`subscribe:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.ok) return json({ error: 'Rate limited' }, 429);

  const db = getDb();
  const docId = email.replace(/[^A-Za-z0-9_.-]/g, '_');
  const ref = db.collection('subscribers').doc(docId);
  const now = Date.now();

  const doc = await ref.get();
  if (doc.exists) return json({ ok: true, already: true });

  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);
  await ref.set({
    email,
    created: now,
    ip_hash: ipHash,
    source: 'homepage',
  });

  return json({ ok: true });
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
