import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

// Persistent rate limiter backed by Netlify Blobs.
// Survives across cold starts and function instances.
// Use for security-critical endpoints (auth) where in-memory is insufficient.

function keyHash(key) {
  return createHash('sha256').update(key).digest('hex').slice(0, 32);
}

export async function checkRatePersistent(key, max, windowMs) {
  const store = getStore('rate-limits');
  const id = keyHash(key);
  const now = Date.now();

  let entry;
  try {
    const raw = await store.get(id);
    if (raw) entry = JSON.parse(raw);
  } catch {
    entry = null;
  }

  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
  } else {
    entry.count++;
  }

  const ok = entry.count <= max;

  try {
    await store.set(id, JSON.stringify(entry));
  } catch {
    // If Blobs is unavailable, fail open (let in-memory limiter handle it)
  }

  const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
  return { ok, remaining: Math.max(0, max - entry.count), retryAfter };
}
