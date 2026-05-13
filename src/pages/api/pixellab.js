export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { checkRate } from '../../lib/rate-limit.js';

export async function POST({ request, clientAddress }) {
  const corsHeaders = corsHeadersFor(request, 'POST, OPTIONS');

  if (!requireAuth(request, 'legion')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRate(`pixellab:${ip}`, 10, 60 * 1000);
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

  const w = Math.min(Math.max(Number(width) || 128, 16), 512);
  const h = Math.min(Math.max(Number(height) || 128, 16), 512);

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
    console.error('[pixellab] error:', err.message);
    return new Response(
      JSON.stringify({ error: "Failed to call PixelLab" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'POST, OPTIONS');
}
