// Shared CORS helper. Only allow same-site and explicitly configured origins.
// Set ALLOWED_ORIGINS as a comma-separated list in env.

const DEFAULT_ALLOWED = [
  'https://dustinlanders.com',
  'https://www.dustinlanders.com',
];

const envList = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const ALLOWED = new Set([...DEFAULT_ALLOWED, ...envList]);

// Allow localhost during dev
if (process.env.NODE_ENV !== 'production') {
  ALLOWED.add('http://localhost:4321');
  ALLOWED.add('http://127.0.0.1:4321');
}

export function corsHeadersFor(request, methods = 'GET, POST, OPTIONS') {
  const origin = request?.headers?.get?.('Origin') || '';
  const allow = ALLOWED.has(origin) ? origin : '';
  const h = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
  if (allow) {
    h['Access-Control-Allow-Origin'] = allow;
    h['Access-Control-Allow-Credentials'] = 'true';
  }
  return h;
}

export function preflight(request, methods) {
  return new Response(null, { status: 204, headers: corsHeadersFor(request, methods) });
}
