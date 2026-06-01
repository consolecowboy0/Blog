export const prerender = false;

import { createHash } from 'node:crypto';
import { getDb } from '../../lib/firebase.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

// Records a single pageview into Firestore (collection: "pageviews").
// Public endpoint, fired by a small beacon in BaseLayout. No PII stored:
// visitor id is a daily-rotating salted hash of IP + UA, so it can't be
// reversed and resets every day. Stores only RAW where-from signals (referrer
// host, coarse geo, UTM); channel classification happens at read time.

const MAX_PATH = 512;
const MAX_REF = 256;
const MAX_UTM = 120;

function dayKey(ts) {
  return new Date(ts).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function visitorId(ip, ua, day) {
  return createHash('sha256').update(`${ip}|${ua}|${day}`).digest('hex').slice(0, 16);
}

// Sanitize attacker-controllable UTM strings: strip control/zero-width chars,
// drop angle brackets and scheme-like values, lowercase, length-bound.
function cleanUtm(v) {
  if (typeof v !== 'string') return '';
  v = v
    .replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .toLowerCase();
  if (/^(javascript|data|vbscript):/i.test(v) || /:\/\//.test(v)) return '';
  return v.slice(0, MAX_UTM);
}

// Parse Netlify geolocation headers. Coarse only: country code/name +
// subdivision code. Never city, lat, long, or timezone. Wrapped so a malformed
// header can never break ingest.
function parseGeo(request) {
  let co = '', con = '', reg = '';
  try {
    const raw = request.headers.get('x-nf-geo');
    if (raw) {
      const geo = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
      co = (geo?.country?.code || '').toUpperCase().slice(0, 2);
      // Strip control/zero-width + angle brackets (keep spaces/accents) so a
      // hostile upstream header can not smuggle markup into the country name.
      con = (geo?.country?.name || '')
        .replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, '')
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, 56);
      reg = (geo?.subdivision?.code || '').toUpperCase().slice(0, 6);
    }
  } catch { /* fall through to bare-code fallback */ }
  if (!co) {
    const bare = (request.headers.get('x-nf-country') ||
                  request.headers.get('x-country') || '').toUpperCase().slice(0, 2);
    if (/^[A-Z]{2}$/.test(bare)) co = bare;
  }
  if (!/^[A-Z]{2}$/.test(co)) { co = ''; con = ''; reg = ''; }
  return { co, con, reg };
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

  // UTM (sanitized). Only the three standard keys, only when present.
  let utm_source = '', utm_medium = '', utm_campaign = '';
  if (body.utm && typeof body.utm === 'object') {
    utm_source = cleanUtm(body.utm.source);
    utm_medium = cleanUtm(body.utm.medium);
    utm_campaign = cleanUtm(body.utm.campaign);
  }

  // Geography from request headers (coarse, server-only).
  const { co, con, reg } = parseGeo(request);

  // Owner self-flag (client localStorage marker). Stored so analytics can exclude.
  const own = body.own === 1 || body.own === '1' ? 1 : 0;

  // Cheap human heuristic to reduce bot/datacenter noise in geo/channels. Past
  // the UA bot regex already; also require an Accept-Language header and a
  // Mozilla-ish UA (real browsers send both; many scrapers send neither).
  const al = request.headers.get('Accept-Language') || '';
  const human = al && /mozilla/i.test(ua) ? 1 : 0;

  const ts = Date.now();
  const day = dayKey(ts);

  try {
    const db = getDb();
    const doc = {
      path,
      ts,
      day,
      ref,
      vid: visitorId(ip, ua, day),
      co, // ISO alpha-2 country ('' when unknown)
      con, // country display name
      reg, // coarse subdivision code (no city/lat/long)
      human, // 1 if passed bot regex + has Accept-Language + Mozilla UA
      own, // 1 if owner self-flag set
    };
    // Store UTM only when present (keep docs small; absent = untagged).
    if (utm_source) doc.utm_source = utm_source;
    if (utm_medium) doc.utm_medium = utm_medium;
    if (utm_campaign) doc.utm_campaign = utm_campaign;

    await db.collection('pageviews').add(doc);
  } catch (err) {
    // Never let analytics break a page load.
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
