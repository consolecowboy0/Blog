export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';

// Serialize Agent SDK calls so concurrent requests don't step on the shared
// ANTHROPIC_API_KEY env-var toggle.
let sdkLock = Promise.resolve();

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

  const { system, messages, model, agentConfig } = body;

  if (!system || !messages) {
    return new Response(JSON.stringify({ error: "Missing system or messages" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Acquire the serialization lock before mutating process.env.
  const release = (() => {
    let resolve;
    const next = new Promise(r => { resolve = r; });
    const prev = sdkLock;
    sdkLock = next;
    return { wait: prev, done: resolve };
  })();

  await release.wait;

  // Temporarily remove the API key so the Agent SDK uses OAuth instead.
  const savedApiKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  try {
    const { query } = await import('@anthropic-ai/claude-agent-sdk');
    console.log('[agent-sdk-chat] SDK imported, starting query via Claude Agent SDK');

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

    if (agentConfig && Object.keys(agentConfig).length > 0) {
      options.agents = agentConfig;
    }

    console.log('[agent-sdk-chat] Calling query() with model=%s, prompt length=%d', sdkModel, userPrompt.length);
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

    console.log('[agent-sdk-chat] SDK query complete, result length=%d', result.length);

    if (result && (result.includes('Invalid API key') || result.includes('Fix external API key') || result.includes('authentication'))) {
      return new Response(
        JSON.stringify({ error: "Agent SDK auth error: " + result }),
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
        JSON.stringify({ error: "Agent SDK requires Claude Code CLI installed on the server." }),
        { status: 501, headers: corsHeaders }
      );
    }
    return new Response(
      JSON.stringify({ error: message || "Failed to call Agent SDK" }),
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
