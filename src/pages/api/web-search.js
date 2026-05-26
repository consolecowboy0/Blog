export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  if (!requireAuth(request, 'legion')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRate(`web-search:${ip}`, 20, 60 * 1000);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'Rate limited' }), {
      status: 429,
      headers: { ...corsHeaders, 'Retry-After': String(rl.retryAfter) },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "No Brave Search API key configured" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const { query } = body;

  if (!query || typeof query !== 'string') {
    return new Response(JSON.stringify({ error: "Missing query" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (query.length > 500) {
    return new Response(JSON.stringify({ error: "Query too long" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const params = new URLSearchParams({ q: query, count: '5' });
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!res.ok) {
      console.error('[web-search] upstream error', res.status, await res.text());
      return new Response(
        JSON.stringify({ error: `Search request failed (${res.status})` }),
        { status: 502, headers: corsHeaders }
      );
    }

    const data = await res.json();
    const results = (data.web?.results || []).map(r => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('[web-search]', err);
    return new Response(
      JSON.stringify({ error: "Failed to call Brave Search" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
