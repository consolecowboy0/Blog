export const prerender = false;

import { query } from 'claude-agent-sdk';

export async function POST({ request }) {
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

  const { system, messages, model = "claude-sonnet-4-20250514", agentConfig } = body;

  if (!system || !messages) {
    return new Response(JSON.stringify({ error: "Missing system or messages" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    // Build the user prompt from the last message
    const userPrompt = messages[messages.length - 1]?.content || '';

    // Build Agent SDK options
    const options = {
      model,
      systemPrompt: system,
      allowedTools: [],
    };

    // If subagent configs are provided, wire them up
    if (agentConfig && Object.keys(agentConfig).length > 0) {
      options.agents = agentConfig;
      options.allowedTools = ["Agent"];
    }

    let result = '';
    for await (const event of query({ prompt: userPrompt, options })) {
      // Handle different event shapes from the SDK
      if (typeof event === 'string') {
        result += event;
      } else if (event?.type === 'text') {
        result += event.text;
      } else if (event?.content) {
        result += event.content;
      }
    }

    return new Response(JSON.stringify({ text: result }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to call Agent SDK" }),
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
