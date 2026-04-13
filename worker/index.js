// Main poller. Wakes up every POLL_INTERVAL_MS, reads the legion state blob,
// and if it finds a pending job, hands it to the runner. Sequential on purpose:
// one session per worker. Scale horizontally by running more workers and adding
// a claim step; phase 1 assumes a single worker.
import { getState } from './state.js';
import { runJob } from './runner.js';

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10);

function requireEnv(name) {
  if (!process.env[name]) {
    console.error(`[worker] missing required env var: ${name}`);
    process.exit(1);
  }
}

requireEnv('ANTHROPIC_API_KEY');
requireEnv('AUTH_SECRET');
requireEnv('LEGION_BASE_URL');

let busy = false;

async function tick() {
  if (busy) return;
  let state;
  try {
    state = await getState();
  } catch (err) {
    console.warn('[worker] getState failed:', err.message);
    return;
  }
  if (!state || !state.job || state.job.status !== 'pending') return;

  busy = true;
  console.log('[worker] claiming pending job, rounds=%d model=%s defense=%s', state.config?.rounds, state.config?.model, state.job.defense);
  try {
    const result = await runJob(state);
    console.log('[worker] job finished:', result);
  } catch (err) {
    console.error('[worker] runJob threw:', err);
  } finally {
    busy = false;
  }
}

console.log('[worker] online. base=%s pollMs=%d', process.env.LEGION_BASE_URL, POLL_INTERVAL_MS);
tick();
setInterval(tick, POLL_INTERVAL_MS);
