export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { getCorsHeaders } from '../../lib/cors.js';

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API mode disabled" }), {
      status: 403,
      headers: cors,
    });
  }

  const { system, messages, model = "claude-sonnet-4-20250514" } = body;

  if (!system || !messages) {
    return new Response(JSON.stringify({ error: "Missing system or messages" }), {
      status: 400,
      headers: cors,
    });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[agent-chat] Anthropic API error:', data.error?.message);
      return new Response(
        JSON.stringify({ error: "Upstream API error" }),
        { status: res.status, headers: cors }
      );
    }

    const text = data.content?.[0]?.text || "";
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: cors,
    });
  } catch (err) {
    console.error('[agent-chat] request failed:', err);
    return new Response(
      JSON.stringify({ error: "Failed to call API" }),
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
