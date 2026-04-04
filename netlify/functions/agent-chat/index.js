export const handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const apiKey = body.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "No API key provided" }),
    };
  }

  const { system, messages, model = "claude-sonnet-4-20250514" } = body;

  if (!system || !messages) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing system or messages" }),
    };
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
      return {
        statusCode: res.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: data.error?.message || "API error" }),
      };
    }

    const text = data.content?.[0]?.text || "";
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || "Failed to call Anthropic API" }),
    };
  }
};
