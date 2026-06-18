const MAX_BODY_BYTES = 8192;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
};

export function rejectLargeBody(request) {
  const cl = parseInt(request.headers.get('content-length') || '0', 10);
  return cl > MAX_BODY_BYTES;
}

export function secureHeaders(extra = {}) {
  return { ...NO_STORE_HEADERS, ...extra };
}
