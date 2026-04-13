# Legion Worker

Out-of-process runner for Legion conversations. Keeps a session cranking after the browser tab closes.

## How it fits in

Today the rounds loop runs in the browser. State snapshots live in Netlify Blobs via `/api/legion-state`. The worker poller watches that same blob for a `job` field; when it sees `status: 'pending'`, it claims the job, runs rounds server-side by calling the Anthropic Messages API directly, and writes each response back. The existing browser poller (5s) picks up new messages and renders them live.

The browser does not yet enqueue jobs. That wiring lands later; this package is the runner half.

## Setup

```bash
cd worker
cp .env.example .env
# fill in ANTHROPIC_API_KEY, AUTH_SECRET (same as Astro site), LEGION_BASE_URL
npm install
npm run dev
```

`AUTH_SECRET` must match the Astro site so the worker can mint legion-scope bearer tokens via the same HMAC scheme `src/lib/auth.js` uses.

## Enqueuing a test job by hand

Until the UI wires this up, drop a job into state manually:

```bash
TOKEN=$(node -e "import('./auth.js').then(m => console.log(m.createToken('legion')))")
curl -X PUT "$LEGION_BASE_URL/api/legion-state" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "opening": "It is noon.",
    "sessionTranscript": [],
    "worldState": [],
    "characterStatus": {},
    "config": { "characters": [...], "room": {...}, "relationships": {...}, "model": "claude-sonnet-4-20250514", "orderMode": "default", "rounds": 2 },
    "job": { "status": "pending", "defense": false }
  }'
```

## Stopping a running job

Set `jobControl.stop = true` in state. The runner checks between turns.

## Known gaps vs the browser loop

Phase 1 omits:

- Priority-bidding order (default + random only)
- Whisper filtering per agent in built transcript
- Code execution blocks
- Illustration and summary generation

Transcript shape matches the browser, so render is unchanged. Port the omitted features when we switch the browser over.
