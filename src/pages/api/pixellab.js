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

  if (!description || typeof description !== 'string') {
    return new Response(JSON.stringify({ error: "Missing description" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (description.length > 2000) {
    return new Response(JSON.stringify({ error: "Description too long" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const w = Number(width);
  const h = Number(height);
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 1024 || h > 1024) {
    return new Response(JSON.stringify({ error: "Invalid dimensions (1-1024)" }), {
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
        image_size: { width: w, height: h },
        negative_description: "blurry, low quality, text, watermark",
      }),
    });

    if (!res.ok) {
      console.error('[pixellab] API %d:', res.status, await res.text());
      const status = res.status === 429 ? 429 : 502;
      return new Response(
        JSON.stringify({ error: status === 429 ? "Image generation rate limited" : "Image generation error" }),
        { status, headers: corsHeaders }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify({ image: data.image.base64 }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error('[pixellab]', err);
    return new Response(
      JSON.stringify({ error: "Failed to generate image" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
