export const prerender = false;

import { createHash } from 'node:crypto';
import { getDb } from '../../lib/firebase.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

// Records a single pageview into Firestore (collection: "pageviews").
// Public endpoint, fired by a small beacon in BaseLayout. No PII stored:
// visitor id is a daily-rotating salted hash of IP + UA, so it can't be
// reversed and resets every day.

const MAX_PATH = 512;
const MAX_REF = 256;

function dayKey(ts) {
  return new Date(ts).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function visitorId(ip, ua, day) {
  return createHash('sha256').update(`${ip}|${ua}|${day}`).digest('hex').slice(0, 16);
}

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  const ip =
    clientAddress ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  // Cheap flood guard: 120 views / minute / IP.
  const rl = checkRate(`track:${ip}`, 120, 60 * 1000);
  if (!rl.ok) {
    return new Response(JSON.stringify({ ok: false }), { status: 429, headers: corsHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: corsHeaders });
  }

  let path = typeof body.path === 'string' ? body.path : '';
  if (!path) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: corsHeaders });
  }
  // Keep path only (drop query/hash), bound length.
  path = path.split('?')[0].split('#')[0].slice(0, MAX_PATH);

  // Don't log the analytics dashboard or other private areas viewing themselves.
  if (/^\/(analytics|backend|legion|dm)(\/|$)/.test(path)) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: corsHeaders });
  }

  const ua = (request.headers.get('User-Agent') || '').slice(0, 300);
  // Skip obvious bots/crawlers.
  if (/bot|crawl|spider|slurp|bingpreview|headless|lighthouse/i.test(ua)) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: corsHeaders });
  }

  let ref = typeof body.ref === 'string' ? body.ref : '';
  if (ref) {
    try {
      const u = new URL(ref);
      // Internal navigation isn't a referrer.
      ref = /dustinlanders\.com$/.test(u.hostname) || u.hostname === 'localhost' ? '' : u.hostname;
    } catch {
      ref = '';
    }
  }
  ref = ref.slice(0, MAX_REF);

  const ts = Date.now();
  const day = dayKey(ts);

  try {
    const db = getDb();
    await db.collection('pageviews').add({
      path,
      ts,
      day,
      ref,
      vid: visitorId(ip, ua, day),
    });
  } catch (err) {
    // Never let analytics break a page load.
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
