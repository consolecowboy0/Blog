export const prerender = false;

import { requireAuth } from '../../lib/auth.js';

export async function POST({ request }) {
  if (!requireAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: corsHeaders,
    });
  }

  const { system, messages, model } = body;

  if (!system || !messages) {
    return new Response(JSON.stringify({ error: 'Missing system or messages' }), {
      status: 400, headers: corsHeaders,
    });
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic();

    const res = await client.messages.create({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: system,
      messages: messages,
    });

    const text = res.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    return new Response(JSON.stringify({ text }), {
      status: 200, headers: corsHeaders,
    });
  } catch (err) {
    console.error('[agent-chat] Error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message || 'API call failed' }),
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
