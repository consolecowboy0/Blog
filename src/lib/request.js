const MAX_BODY_BYTES = 64 * 1024; // 64 KB

export async function safeJson(request, maxBytes = MAX_BODY_BYTES) {
  const cl = request.headers.get('Content-Length');
  if (cl && parseInt(cl, 10) > maxBytes) return null;

  const text = await request.text();
  if (text.length > maxBytes) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
