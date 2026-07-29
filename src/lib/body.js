const MAX_BODY = 64 * 1024; // 64 KB

export async function safeJson(request, limit = MAX_BODY) {
  const len = parseInt(request.headers.get('Content-Length') || '', 10);
  if (Number.isFinite(len) && len > limit) return null;

  const text = await request.text();
  if (text.length > limit) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
