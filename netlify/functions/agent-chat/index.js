export default async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }

  const apiKey = body.apiKey || Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return Response.json({ error: "No API key provided" }, { status: 400, headers: corsHeaders });
  }

  const { system, messages, model = "claude-sonnet-4-20250514" } = body;

  if (!system || !messages) {
    return Response.json({ error: "Missing system or messages" }, { status: 400, headers: corsHeaders });
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
      return Response.json(
        { error: data.error?.message || "API error" },
        { status: res.status, headers: corsHeaders }
      );
    }

    const text = data.content?.[0]?.text || "";
    return Response.json({ text }, { headers: corsHeaders });
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to call Anthropic API" },
      { status: 500, headers: corsHeaders }
    );
  }
};

export const config = {
  path: "/.netlify/functions/agent-chat",
};
