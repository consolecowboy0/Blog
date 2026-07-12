// Enforces a maximum request body size before JSON parsing.
// Prevents memory exhaustion from oversized payloads on serverless functions.

const DEFAULT_MAX = 64 * 1024; // 64 KB

export async function parseJsonBody(request, maxBytes = DEFAULT_MAX) {
  const contentLength = request.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return { error: 'Payload too large', status: 413 };
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return { error: 'Failed to read body', status: 400 };
  }

  if (raw.length > maxBytes) {
    return { error: 'Payload too large', status: 413 };
  }

  try {
    return { data: JSON.parse(raw) };
  } catch {
    return { error: 'Invalid JSON', status: 400 };
  }
}
