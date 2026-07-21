const MAX_BODY = 16 * 1024; // 16 KB

export async function readJsonBody(request, maxBytes = MAX_BODY) {
  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) return { error: 'Content-Type must be application/json', status: 415 };

  const len = parseInt(request.headers.get('Content-Length') || '', 10);
  if (len > maxBytes) return { error: 'Payload too large', status: 413 };

  let raw;
  try {
    raw = await request.text();
  } catch {
    return { error: 'Could not read body', status: 400 };
  }

  if (raw.length > maxBytes) return { error: 'Payload too large', status: 413 };

  try {
    return { data: JSON.parse(raw) };
  } catch {
    return { error: 'Invalid JSON', status: 400 };
  }
}
