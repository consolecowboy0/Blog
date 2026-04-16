export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';

export async function POST({ request }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  if (!requireAuth(request, 'legion')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query" }), {
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
      const err = await res.text();
      return new Response(
        JSON.stringify({ error: `Brave Search error (${res.status}): ${err}` }),
        { status: res.status, headers: corsHeaders }
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
    return new Response(
      JSON.stringify({ error: err.message || "Failed to call Brave Search" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
