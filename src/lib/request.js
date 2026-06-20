// Shared request-handling helpers for API endpoints.

const DEFAULT_MAX_BODY = 8192; // 8 KB

// Extract the real client IP. Rely on the platform-provided clientAddress
// (Netlify sets this from the socket) rather than X-Forwarded-For, which an
// attacker can spoof to bypass rate limits.
export function clientIp(clientAddress) {
  return clientAddress || 'unknown';
}

// Parse JSON from the request body with a byte-size guard. Returns the parsed
// object on success, or null if the body is missing, oversized, or malformed.
// The Content-Length pre-check is a fast reject; the text-length check catches
// chunked/streaming bodies that omit Content-Length.
export async function safeJson(request, maxBytes = DEFAULT_MAX_BODY) {
  const cl = parseInt(request.headers.get('Content-Length') || '', 10);
  if (Number.isFinite(cl) && cl > maxBytes) return null;
  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Standard 429 response with Retry-After.
export function rateLimited(retryAfter, corsHeaders) {
  return new Response(JSON.stringify({ error: 'Rate limited' }), {
    status: 429,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
    },
  });
}
