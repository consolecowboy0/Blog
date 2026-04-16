const ALLOWED_ORIGINS = [
  'https://dustinlanders.com',
  'https://www.dustinlanders.com',
];

// Allow local dev origins outside production
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:4321', 'http://localhost:3000');
}

export function getCorsHeaders(request, methods = 'POST, OPTIONS') {
  const origin = request?.headers?.get?.('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
