export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

let sdkLock = Promise.resolve();

const MAX_SYSTEM_LENGTH = 50_000;
const MAX_BODY_SIZE = 500_000;

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  if (!requireAuth(request, 'legion')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRate(`agent-sdk:${ip}`, 20, 60 * 1000);
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

  const { system, messages, model, agentConfig } = body;

  if (!system || !messages) {
    return new Response(JSON.stringify({ error: "Missing system or messages" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (typeof system !== 'string' || system.length > MAX_SYSTEM_LENGTH) {
    return new Response(JSON.stringify({ error: "Invalid or oversized system prompt" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!Array.isArray(messages) || JSON.stringify(messages).length > MAX_BODY_SIZE) {
    return new Response(JSON.stringify({ error: "Invalid or oversized messages" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const release = (() => {
    let resolve;
    const next = new Promise(r => { resolve = r; });
    const prev = sdkLock;
    sdkLock = next;
    return { wait: prev, done: resolve };
  })();

  await release.wait;

  const savedApiKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  try {
    const { query } = await import('@anthropic-ai/claude-agent-sdk');

    const userPrompt = messages[messages.length - 1]?.content || '';

    const sdkModel = model?.includes('opus') ? 'opus'
      : model?.includes('haiku') ? 'haiku'
      : 'sonnet';

    const options = {
      model: sdkModel,
      systemPrompt: system,
      maxTurns: 4,
      permissionMode: 'auto',
    };

    if (agentConfig && typeof agentConfig === 'object' && Object.keys(agentConfig).length > 0) {
      options.agents = agentConfig;
    }

    let result = '';
    for await (const message of query({ prompt: userPrompt, options })) {
      if (message.type === 'result' && message.subtype === 'success') {
        result = message.result;
        break;
      }
      if (message.type === 'assistant' && message.message?.content) {
        for (const block of message.message.content) {
          if (block.type === 'text') {
            result = block.text;
          }
        }
      }
    }

    if (result && (result.includes('Invalid API key') || result.includes('Fix external API key') || result.includes('authentication'))) {
      return new Response(
        JSON.stringify({ error: "Agent SDK auth error" }),
        { status: 401, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ text: result }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    const message = err.message || '';
    if (message.includes('MODULE_NOT_FOUND') || message.includes('Cannot find') || message.includes('not found')) {
      return new Response(
        JSON.stringify({ error: "Agent SDK not available" }),
        { status: 501, headers: corsHeaders }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to call Agent SDK" }),
      { status: 500, headers: corsHeaders }
    );
  } finally {
    if (savedApiKey !== undefined) process.env.ANTHROPIC_API_KEY = savedApiKey;
    release.done();
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
