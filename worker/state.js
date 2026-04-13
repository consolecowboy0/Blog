// Thin HTTP client for /api/legion-state. Uses the same Bearer-token scheme the
// browser uses so we do not need a second auth surface. The whole protocol is:
// GET returns the JSON blob, PUT replaces it. The worker never uses DELETE -- archiving
// remains the browser's responsibility on Clear.
import { createToken } from './auth.js';

const BASE = process.env.LEGION_BASE_URL || 'http://localhost:4321';
let cachedToken = null;

function authHeader() {
  if (!cachedToken) cachedToken = createToken('legion');
  return `Bearer ${cachedToken}`;
}

export async function getState() {
  const res = await fetch(`${BASE}/api/legion-state`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) throw new Error(`getState ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function putState(state) {
  const res = await fetch(`${BASE}/api/legion-state`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`putState ${res.status}: ${await res.text()}`);
  return res.json();
}
