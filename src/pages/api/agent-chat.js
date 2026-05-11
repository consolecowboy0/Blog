export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';

const ALLOWED_MODELS = new Set([
  'claude-sonnet-4-20250514',
  'claude-haiku-4-5-20251001',
]);

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API mode disabled" }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  const { system, messages, model: requestedModel } = body;
  const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : 'claude-sonnet-4-20250514';

  if (!system || typeof system !== 'string' || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Missing or invalid system/messages" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (system.length > 50000 || messages.length > 200) {
    return new Response(JSON.stringify({ error: "Input too large" }), {
      status: 400,
      headers: corsHeaders,
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
      return new Response(
        JSON.stringify({ error: data.error?.message || "API error" }),
        { status: res.status, headers: corsHeaders }
      );
    }

    const text = data.content?.[0]?.text || "";
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('[agent-chat]', err);
    return new Response(
      JSON.stringify({ error: "Failed to call Anthropic API" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
