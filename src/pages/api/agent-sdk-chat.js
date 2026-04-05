export const prerender = false;

export async function POST({ request }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // The Agent SDK spawns a local Claude Code CLI process.
  // It cannot run in serverless environments (Netlify, Vercel, etc.).
  // Detect serverless and fail fast with a clear message.
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL) {
    return new Response(
      JSON.stringify({ error: "Agent SDK mode requires a local server with Claude Code CLI installed. Switch to API mode for this deployed environment." }),
      { status: 501, headers: corsHeaders }
    );
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

  try {
    // Dynamic import — the Agent SDK requires Claude Code CLI installed on the host.
    const { query } = await import('@anthropic-ai/claude-agent-sdk');

    // Build the user prompt from the last message
    const userPrompt = messages[messages.length - 1]?.content || '';

    // Map full model IDs to SDK aliases
    const sdkModel = model?.includes('opus') ? 'opus'
      : model?.includes('haiku') ? 'haiku'
      : 'sonnet';

    const options = {
      model: sdkModel,
      systemPrompt: system,
      maxTurns: 1,
      permissionMode: 'default',
    };

    // If subagent configs are provided, wire them up
    // AgentDefinition: { description, prompt, tools?, model? }
    if (agentConfig && Object.keys(agentConfig).length > 0) {
      options.agents = agentConfig;
      options.allowedTools = ["Agent"];
    }

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

    return new Response(JSON.stringify({ text: result }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('MODULE_NOT_FOUND') || msg.includes('Cannot find') || msg.includes('not found') || msg.includes('CLINotFound')) {
      return new Response(
        JSON.stringify({ error: "Agent SDK mode requires Claude Code CLI installed on the server. Switch to API mode." }),
        { status: 501, headers: corsHeaders }
      );
    }
    return new Response(
      JSON.stringify({ error: msg || "Failed to call Agent SDK" }),
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
