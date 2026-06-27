const MAX_BODY_BYTES = 16_384; // 16 KB - generous for any JSON payload in this app

export async function parseJsonBody(request) {
  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) return { error: 'Content-Type must be application/json', status: 415 };

  const cl = request.headers.get('Content-Length');
  if (cl && parseInt(cl, 10) > MAX_BODY_BYTES) {
    return { error: 'Payload too large', status: 413 };
  }

  let raw;
  try {
    raw = await request.text();
  } catch {
    return { error: 'Failed to read body', status: 400 };
  }

  if (raw.length > MAX_BODY_BYTES) {
    return { error: 'Payload too large', status: 413 };
  }

  try {
    return { data: JSON.parse(raw) };
  } catch {
    return { error: 'Invalid JSON', status: 400 };
  }
}
