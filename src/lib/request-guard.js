const MAX_BODY = 8 * 1024; // 8 KB

export async function parseJsonBody(request, maxBytes = MAX_BODY) {
  const cl = parseInt(request.headers.get('Content-Length') || '', 10);
  if (cl > maxBytes) return { error: 'Payload too large', status: 413 };

  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) {
    return { error: 'Content-Type must be application/json', status: 415 };
  }

  let text;
  try {
    text = await request.text();
  } catch {
    return { error: 'Unreadable body', status: 400 };
  }
  if (text.length > maxBytes) return { error: 'Payload too large', status: 413 };

  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: 'Invalid JSON', status: 400 };
  }
}
