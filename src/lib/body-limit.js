const DEFAULT_MAX = 16_384; // 16 KB

export async function readJsonBody(request, maxBytes = DEFAULT_MAX) {
  const cl = parseInt(request.headers.get('Content-Length') || '', 10);
  if (cl > maxBytes) return { error: 'Payload too large', status: 413 };

  const text = await request.text();
  if (text.length > maxBytes) return { error: 'Payload too large', status: 413 };

  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: 'Invalid JSON', status: 400 };
  }
}
