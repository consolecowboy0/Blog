const MAX_BODY = 64 * 1024; // 64 KB

export function safeIp(clientAddress) {
  return clientAddress || 'unknown';
}

export async function parseJsonBody(request, maxBytes = MAX_BODY) {
  const len = parseInt(request.headers.get('Content-Length') || '', 10);
  if (len > maxBytes) return { error: 'Payload too large', status: 413 };

  const text = await request.text();
  if (text.length > maxBytes) return { error: 'Payload too large', status: 413 };

  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: 'Invalid JSON', status: 400 };
  }
}
