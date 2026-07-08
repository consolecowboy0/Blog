const MAX_BODY = 64 * 1024; // 64 KiB

export async function safeParseJson(request, maxBytes = MAX_BODY) {
  const cl = request.headers.get('Content-Length');
  if (cl && parseInt(cl, 10) > maxBytes) return { error: 'Payload too large' };

  const reader = request.body?.getReader();
  if (!reader) return { error: 'No body' };

  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        reader.cancel();
        return { error: 'Payload too large' };
      }
      chunks.push(value);
    }
  } catch {
    return { error: 'Read error' };
  }

  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { buf.set(c, offset); offset += c.byteLength; }

  try {
    return { data: JSON.parse(new TextDecoder().decode(buf)) };
  } catch {
    return { error: 'Invalid JSON' };
  }
}
