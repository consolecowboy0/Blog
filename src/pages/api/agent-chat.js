export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

const ALLOWED_MODELS = new Set([
  'claude-sonnet-4-20250514',
  'claude-haiku-4-5-20251001',
]);

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  if (!requireAuth(request, 'legion')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRate(`agent-chat:${ip}`, 30, 60 * 1000);
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API mode disabled" }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  const { system, messages, model = "claude-sonnet-4-20250514" } = body;

  if (!system || typeof system !== 'string' || system.length > 10000) {
    return new Response(JSON.stringify({ error: "Invalid system prompt" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
    return new Response(JSON.stringify({ error: "Invalid messages" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!ALLOWED_MODELS.has(model)) {
    return new Response(JSON.stringify({ error: "Model not allowed" }), {
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
      console.error('[agent-chat] Anthropic API %d:', res.status, data.error?.message);
      const status = res.status === 429 ? 429 : 502;
      return new Response(
        JSON.stringify({ error: status === 429 ? "Rate limited by upstream" : "Upstream API error" }),
        { status, headers: corsHeaders }
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
