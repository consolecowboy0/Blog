const store = new Map();
const MAX_ENTRIES = 10000;

function prune(now) {
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
  if (store.size >= MAX_ENTRIES) prune(now);
  if (store.size >= MAX_ENTRIES) {
    const oldest = [...store.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    const drop = Math.floor(oldest.length / 4);
    for (let i = 0; i < drop; i++) store.delete(oldest[i][0]);
  }
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
