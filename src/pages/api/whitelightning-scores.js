export const prerender = false;

import { getDb } from '../../lib/firebase.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

// Public, global leaderboard for the White Lightning game (public/whitelightning).
// Firestore collection "whitelightning_scores": { i: initials, s: score, ts }.
// Trimmed to the top BOARD_MAX rows on every write, so the collection never grows.

const BOARD_MAX = 10;
const MAX_SCORE = 100000; // generous ceiling; blocks obviously spoofed submissions

function cleanInitials(v) {
  let s = (typeof v === 'string' ? v : '').toUpperCase().replace(/[^A-Z]/g, '');
  if (s.length < 3) s = (s + 'AAA').slice(0, 3);
  return s.slice(0, 3);
}

export async function GET({ request }) {
  const corsHeaders = { ...corsHeadersFor(request, 'GET, POST, OPTIONS'), 'Content-Type': 'application/json' };
  try {
    const db = getDb();
    const snap = await db.collection('whitelightning_scores').orderBy('s', 'desc').limit(BOARD_MAX).get();
    const board = snap.docs.map((d) => { const v = d.data(); return { i: v.i, s: v.s }; });
    return new Response(JSON.stringify({ board }), { status: 200, headers: corsHeaders });
  } catch {
    return new Response(JSON.stringify({ board: [] }), { status: 200, headers: corsHeaders });
  }
}

export async function POST({ request, clientAddress }) {
  const corsHeaders = { ...corsHeadersFor(request, 'GET, POST, OPTIONS'), 'Content-Type': 'application/json' };

  const ip =
    clientAddress ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  const rl = checkRate(`wlscore:${ip}`, 10, 60 * 1000);
  if (!rl.ok) {
    return new Response(JSON.stringify({ ok: false }), { status: 429, headers: corsHeaders });
  }

  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) {
    return new Response(JSON.stringify({ ok: false }), { status: 415, headers: corsHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: corsHeaders });
  }

  const score = Math.floor(Number(body.score));
  if (!Number.isFinite(score) || score <= 0 || score > MAX_SCORE) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: corsHeaders });
  }
  const initials = cleanInitials(body.initials);

  try {
    const db = getDb();
    const col = db.collection('whitelightning_scores');
    await col.add({ i: initials, s: score, ts: Date.now() });

    const snap = await col.orderBy('s', 'desc').get();
    if (snap.size > BOARD_MAX) {
      await Promise.all(snap.docs.slice(BOARD_MAX).map((d) => d.ref.delete()));
    }
    const board = snap.docs.slice(0, BOARD_MAX).map((d) => { const v = d.data(); return { i: v.i, s: v.s }; });
    return new Response(JSON.stringify({ ok: true, board }), { status: 200, headers: corsHeaders });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers: corsHeaders });
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'GET, POST, OPTIONS');
}
