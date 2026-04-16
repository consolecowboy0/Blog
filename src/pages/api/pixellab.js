export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';

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

  const apiKey = process.env.PIXELLAB_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "No PixelLab API key configured" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const { description, width = 128, height = 128 } = body;

  if (!description) {
    return new Response(JSON.stringify({ error: "Missing description" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const res = await fetch("https://api.pixellab.ai/v1/generate-image-pixflux", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        description,
        image_size: { width, height },
        negative_description: "blurry, low quality, text, watermark",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(
        JSON.stringify({ error: `PixelLab error (${res.status}): ${err}` }),
        { status: res.status, headers: corsHeaders }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify({ image: data.image.base64 }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to call PixelLab" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
