// Simple in-memory sliding-window rate limiter.
// Good enough for single-instance Netlify functions and dev.
// For multi-instance production, replace the store with Netlify Blobs or Redis.

const store = new Map();

function prune(now) {
  if (store.size < 1000) return;
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
}

/**
 * @param {string} key  unique identifier (e.g. "auth:1.2.3.4")
 * @param {number} max  max allowed hits in window
 * @param {number} windowMs window duration in ms
 * @returns {{ ok: boolean, remaining: number, retryAfter: number }}
 */
export function checkRate(key, max, windowMs) {
  const now = Date.now();
  prune(now);
  let entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }
  entry.count++;
  const remaining = Math.max(0, max - entry.count);
  const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
  return { ok: entry.count <= max, remaining, retryAfter };
}
