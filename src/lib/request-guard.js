const MAX_BODY = 64 * 1024; // 64 KB

export function bodyTooLarge(request, limit = MAX_BODY) {
  const cl = request.headers.get('Content-Length');
  if (cl && parseInt(cl, 10) > limit) return true;
  return false;
}

export async function safeJson(request, limit = MAX_BODY) {
  if (bodyTooLarge(request, limit)) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}
