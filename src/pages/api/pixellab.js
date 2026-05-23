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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.PIXELLAB_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "PixelLab not configured" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { description, width = 128, height = 128 } = body;

  if (!description || typeof description !== 'string') {
    return new Response(JSON.stringify({ error: "Missing description" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const safeWidth = Math.min(Math.max(Math.floor(Number(width)) || 128, 16), 1024);
  const safeHeight = Math.min(Math.max(Math.floor(Number(height)) || 128, 16), 1024);

  try {
    const res = await fetch("https://api.pixellab.ai/v1/generate-image-pixflux", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        description: description.slice(0, 2000),
        image_size: { width: safeWidth, height: safeHeight },
        negative_description: "blurry, low quality, text, watermark",
      }),
    });

    if (!res.ok) {
      console.error('[pixellab] upstream error:', res.status);
      return new Response(
        JSON.stringify({ error: "Image generation failed" }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify({ image: data.image.base64 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[pixellab] error:', err.message);
    return new Response(
      JSON.stringify({ error: "Failed to generate image" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
