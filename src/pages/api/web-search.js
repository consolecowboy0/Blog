import { loadEnv } from "vite";

export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { getCorsHeaders } from '../../lib/cors.js';

const env = loadEnv("", process.cwd(), "");

export async function POST({ request }) {
  const cors = getCorsHeaders(request);

  if (!requireAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: cors,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: cors,
    });
  }

  const apiKey = env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "No Brave Search API key configured" }), {
      status: 500,
      headers: cors,
    });
  }

  const { query } = body;

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query" }), {
      status: 400,
      headers: cors,
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
      console.error('[web-search] Brave API error:', res.status);
      return new Response(
        JSON.stringify({ error: "Search service error" }),
        { status: res.status, headers: cors }
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
      headers: cors,
    });
  } catch (err) {
    console.error('[web-search] request failed:', err);
    return new Response(
      JSON.stringify({ error: "Failed to call search service" }),
      { status: 500, headers: cors }
    );
  }
}

export async function OPTIONS({ request }) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
