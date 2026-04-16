import { loadEnv } from "vite";

export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { getCorsHeaders } from '../../lib/cors.js';

const env = loadEnv("", process.cwd(), "");

export async function POST({ request }) {
  const cors = getCorsHeaders(request);

  if (!requireAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: cors,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: cors,
    });
  }

  const apiKey = env.PIXELLAB_API_KEY || process.env.PIXELLAB_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "No PixelLab API key configured" }), {
      status: 500,
      headers: cors,
    });
  }

  const { description, width = 128, height = 128 } = body;

  if (!description) {
    return new Response(JSON.stringify({ error: "Missing description" }), {
      status: 400,
      headers: cors,
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
      console.error('[pixellab] API error:', res.status);
      return new Response(
        JSON.stringify({ error: "PixelLab service error" }),
        { status: res.status, headers: cors }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify({ image: data.image.base64 }), {
      status: 200,
      headers: cors,
    });
  } catch (err) {
    console.error('[pixellab] request failed:', err);
    return new Response(
      JSON.stringify({ error: "Failed to call PixelLab" }),
      { status: 500, headers: cors }
    );
  }
}

export async function OPTIONS({ request }) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
