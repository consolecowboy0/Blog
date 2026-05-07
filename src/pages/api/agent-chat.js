export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

const ALLOWED_MODELS = new Set([
  'claude-sonnet-4-20250514',
  'claude-haiku-4-20250414',
]);

const MAX_SYSTEM_LENGTH = 50_000;
const MAX_MESSAGES_LENGTH = 200_000;

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  if (!requireAuth(request, 'legion')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRate(`agent-chat:${ip}`, 30, 5 * 60 * 1000);
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

  if (!system || !messages) {
    return new Response(JSON.stringify({ error: "Missing system or messages" }), {
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

  if (typeof system !== 'string' || system.length > MAX_SYSTEM_LENGTH) {
    return new Response(JSON.stringify({ error: "system too large" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!Array.isArray(messages) || JSON.stringify(messages).length > MAX_MESSAGES_LENGTH) {
    return new Response(JSON.stringify({ error: "messages too large" }), {
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
        JSON.stringify({ error: "API error" }),
        { status: res.status, headers: corsHeaders }
      );
    }

    const text = data.content?.[0]?.text || "";
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to call Anthropic API" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
