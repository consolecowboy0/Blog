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
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

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

  try {
    // Ensure no stray API key overrides OAuth auth
    delete process.env.ANTHROPIC_API_KEY;

    const { query } = await import('@anthropic-ai/claude-agent-sdk');
    console.log('[agent-sdk-chat] SDK imported, starting query via Claude Agent SDK');

    // Build the user prompt from the last message
    const userPrompt = messages[messages.length - 1]?.content || '';

    // Map full model IDs to SDK aliases
    const sdkModel = model?.includes('opus') ? 'opus'
      : model?.includes('haiku') ? 'haiku'
      : 'sonnet';

    const options = {
      model: sdkModel,
      systemPrompt: system,
      maxTurns: 4,
      permissionMode: 'auto',
    };

    // If subagent configs are provided, wire them up
    // AgentDefinition: { description, prompt, tools?, model? }
    if (agentConfig && Object.keys(agentConfig).length > 0) {
      options.agents = agentConfig;
    }

    console.log('[agent-sdk-chat] Calling query() with model=%s, prompt length=%d', sdkModel, userPrompt.length);
    let result = '';
    for await (const message of query({ prompt: userPrompt, options })) {
      // SDKResultMessage — final result with the text output
      if (message.type === 'result' && message.subtype === 'success') {
        result = message.result;
        break;
      }
      // SDKAssistantMessage — contains content blocks from Anthropic API
      if (message.type === 'assistant' && message.message?.content) {
        for (const block of message.message.content) {
          if (block.type === 'text') {
            result = block.text;
          }
        }
      }
    }

    console.log('[agent-sdk-chat] SDK query complete, result length=%d', result.length);

    // Detect auth errors returned as "successful" results
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
    // Provide a helpful error if the SDK isn't available
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
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
