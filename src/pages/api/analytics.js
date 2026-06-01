export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { getDb } from '../../lib/firebase.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';

// Returns aggregated pageview stats for the dashboard. Auth: scope "analytics".
// Query param: ?days=30 (1..90).

export async function GET({ request }) {
  const corsHeaders = corsHeadersFor(request, 'GET, OPTIONS');

  const auth = requireAuth(request, 'analytics');
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);
  let days = parseInt(url.searchParams.get('days') || '30', 10);
  if (!Number.isFinite(days) || days < 1) days = 30;
  if (days > 90) days = 90;

  const since = Date.now() - days * 24 * 60 * 60 * 1000;

  try {
    const db = getDb();
    const snap = await db
      .collection('pageviews')
      .where('ts', '>=', since)
      .get();

    let total = 0;
    const visitors = new Set();
    const byDay = new Map();      // day -> { views, visitors:Set }
    const byPath = new Map();     // path -> views
    const byRef = new Map();      // ref host -> views

    snap.forEach((doc) => {
      const d = doc.data();
      total++;
      if (d.vid) visitors.add(d.vid);

      const day = d.day || new Date(d.ts).toISOString().slice(0, 10);
      let dd = byDay.get(day);
      if (!dd) { dd = { views: 0, visitors: new Set() }; byDay.set(day, dd); }
      dd.views++;
      if (d.vid) dd.visitors.add(d.vid);

      const path = d.path || '/';
      byPath.set(path, (byPath.get(path) || 0) + 1);

      if (d.ref) byRef.set(d.ref, (byRef.get(d.ref) || 0) + 1);
    });

    // Build a continuous day series so the chart has no gaps.
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const dd = byDay.get(key);
      series.push({
        day: key,
        views: dd ? dd.views : 0,
        visitors: dd ? dd.visitors.size : 0,
      });
    }

    const topPaths = [...byPath.entries()]
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 25);

    const topReferrers = [...byRef.entries()]
      .map(([ref, views]) => ({ ref, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    return new Response(
      JSON.stringify({
        days,
        totals: { views: total, visitors: visitors.size },
        series,
        topPaths,
        topReferrers,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'GET, OPTIONS');
}
