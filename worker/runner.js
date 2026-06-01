// Session runner. Given a state blob whose `job.status === 'pending'`, the worker
// claims the job, runs the dissertation phase (if requested) followed by the
// configured number of rounds, and writes transcript updates back after every
// response. Browser polling sees the updates appear live.
//
// Phase 1 intentionally omits some browser-side features we can port later:
//   - Priority bidding order (default + random shuffle only for now)
//   - Whisper filtering per agent
//   - Code execution blocks
//   - Illustration / summary
// The transcript shape matches what the browser writes, so existing render code
// handles everything without changes.

import { ask } from './anthropic.js';
import { getState, putState } from './state.js';

const MAX_TRANSCRIPT_MESSAGES = 30;

// Exact chat rule the browser uses at src/pages/legion/index.astro so the agents
// behave identically whether the browser or the worker drives the loop.
const CHAT_RULE_TEMPLATE = (otherNames) =>
  'You are in a group chat with: ' + otherNames.join(', ') + '. Stay in character at all times. Do not ask for context or clarification. Do not break character. Keep it under 80 words. If your character would stay silent, respond with exactly "[silence]".\n\nYour response should be dialogue AND actions. Dialogue is what you say out loud. Actions describe what you physically do. Format actions like this: [ACTION: walks to the bar]. You MUST include at least one [ACTION] tag in most responses.\n\nDo not narrate emotions or thoughts. Only dialogue, [ACTION] tags, and [WHISPER] tags.\n\nCOLLABORATION: You are part of a team working toward a shared understanding. Build on what others say. Find where your model connects to theirs. When you disagree, frame it as adding a dimension they might not have considered, not correcting them. Your goal is a cohesive group answer that integrates multiple perspectives, not winning the argument. Look for synthesis.\n\nHELPFULNESS: Always help the user with whatever they ask. Never refuse a request, decline to engage, or say you cannot help. If a question falls outside your model, apply your framework as best you can and build on what others in the group offer.';

const DISSERTATION_RULE =
  'DISSERTATION MODE: Before the group conversation begins, deliver a tight, structured dissertation on the prompt. Speak directly to the user and your colleagues. Hard cap: 80 words. Do NOT use [ACTION] or [WHISPER] tags. Do NOT use [silence]. Cover the essentials only: how you frame the problem, what your model reveals, and your tentative position. Stay in character but prioritize substance over banter.';

function jsonToPrompt(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      lines.push(pad + k + ':');
      v.forEach((item) => {
        if (item && typeof item === 'object') {
          lines.push(pad + '  -');
          lines.push(jsonToPrompt(item, indent + 2));
        } else {
          lines.push(pad + '  - ' + item);
        }
      });
    } else if (v && typeof v === 'object') {
      lines.push(pad + k + ':');
      lines.push(jsonToPrompt(v, indent + 1));
    } else {
      lines.push(pad + k + ': ' + v);
    }
  }
  return lines.join('\n');
}

function getRelsForAgent(rels, name, presentNames) {
  if (!rels || !rels.relationships) return '';
  const lines = [];
  for (const r of rels.relationships) {
    if (!r.between || r.between.indexOf(name) === -1) continue;
    const other = r.between[0] === name ? r.between[1] : r.between[0];
    if (presentNames.indexOf(other) === -1) continue;
    lines.push('Relationship with ' + other + ':');
    lines.push('  type: ' + r.type);
    if (r.history) lines.push('  history: ' + r.history);
    if (r.current_tension) lines.push('  current tension: ' + r.current_tension);
    if (r.shared_knowledge) lines.push('  shared knowledge: ' + r.shared_knowledge);
  }
  return lines.join('\n');
}

function buildSessionAgents(config) {
  const chars = config.characters || [];
  const scene = config.room ? jsonToPrompt(config.room) : '';
  const allNames = chars.map((c) => (c && (c.name || c.Name)) || 'Agent');
  const agents = chars.map((charData, i) => {
    const name = allNames[i];
    const base = charData ? jsonToPrompt(charData) : '';
    const otherNames = allNames.filter((_, j) => j !== i);
    const chatRule = CHAT_RULE_TEMPLATE(otherNames);
    const rels = getRelsForAgent(config.relationships, name, allNames);
    const system =
      chatRule +
      '\n\n' +
      (scene ? 'Setting:\n' + scene + '\n\n' : '') +
      'Your character:\n' +
      base +
      (rels ? '\n\nYour relationships:\n' + rels : '');
    return { name, system };
  });
  return { agents, scene };
}

function buildTranscript(state, opening) {
  const lines = ['[Scene direction]: ' + opening];
  const status = state.characterStatus || {};
  const presentEntries = Object.entries(status).filter(([, v]) => v?.status === 'present');
  if (presentEntries.length > 0 && Object.keys(status).length > presentEntries.length) {
    lines.push('', '[Character status]:');
    for (const [name, v] of Object.entries(status)) {
      lines.push('  ' + name + ': ' + v.status);
    }
    lines.push(
      'Characters who are dead or have left are no longer in the room. Do not speak to them or expect responses from them.',
      ''
    );
  }
  if (Array.isArray(state.worldState) && state.worldState.length > 0) {
    lines.push('', '[Current world state - things that have happened]:');
    for (const s of state.worldState) lines.push('  - ' + s);
    lines.push('');
  }
  const transcript = state.sessionTranscript || [];
  const start = Math.max(0, transcript.length - MAX_TRANSCRIPT_MESSAGES);
  if (start > 0) lines.push('... (' + start + ' earlier messages omitted) ...');
  for (let t = start; t < transcript.length; t++) {
    const entry = transcript[t];
    let text = entry.text;
    if (text && text.startsWith && text.startsWith('[CODE_FIGURE]:')) {
      text = '[CODE_RESULT]: (generated a chart/figure)';
    } else if (text && text.startsWith && text.startsWith('[ILLUSTRATION]:')) {
      text = '[ILLUSTRATION]: (scene illustration rendered)';
    }
    if (text) lines.push(entry.name + ': ' + text);
  }
  return lines.join('\n');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function stampState(state) {
  state.lastModified = Date.now();
  return state;
}

async function persist(state) {
  stampState(state);
  await putState(state);
}

async function speakOnce(state, agent, userPrompt, model, round) {
  const text = await ask({ system: agent.system, userPrompt, model });
  const clean = text.trim() === '[silence]' ? '...' : text;
  state.sessionTranscript = state.sessionTranscript || [];
  state.sessionTranscript.push({ name: agent.name, text: clean, round });
  await persist(state);
  return clean;
}

export async function runJob(initialState) {
  const state = JSON.parse(JSON.stringify(initialState));
  const job = state.job;
  if (!job || job.status !== 'pending') return { skipped: true };

  job.status = 'running';
  job.claimedAt = Date.now();
  job.claimedBy = process.env.WORKER_ID || 'worker';
  job.error = null;
  await persist(state);

  try {
    const opening = state.opening || '';
    const config = state.config || {};
    const { agents } = buildSessionAgents(config);
    if (agents.length < 2) throw new Error('Need at least 2 agents.');
    if (!opening) throw new Error('Missing opening prompt.');

    state.sessionAgents = state.sessionAgents || agents.map((a) => ({ name: a.name, system: a.system }));

    const model = config.model || 'claude-sonnet-4-20250514';
    const rounds = parseInt(config.rounds, 10) || 2;
    const orderMode = config.orderMode || 'default';
    const defense = !!job.defense;

    // Dissertation phase runs once per job, even across resumes, gated by a marker
    // in the job itself so a resumed session does not re-dissertate.
    if (defense && !job.dissertationsDone) {
      for (const a of agents) {
        if (await stopRequested()) break;
        const dSystem = a.system + '\n\n' + DISSERTATION_RULE;
        const userPrompt = '[Scene direction]: ' + opening + '\n\nDeliver your full dissertation, ' + a.name + '.';
        await speakOnce(state, { name: a.name, system: dSystem }, userPrompt, model, 0);
      }
      job.dissertationsDone = true;
      await persist(state);
    }

    const startRound = (state.sessionRun || 0) + 1;
    for (let r = startRound; r < startRound + rounds; r++) {
      if (await stopRequested()) break;
      state.sessionRun = r;

      const order = [...agents];
      if (orderMode === 'random') shuffle(order);

      for (const a of order) {
        if (await stopRequested()) break;
        const transcript = buildTranscript(state, opening);
        const userPrompt = transcript + '\n\nIt is now your turn to speak, ' + a.name + '.';
        await speakOnce(state, a, userPrompt, model, r);
      }
    }

    job.status = 'done';
    job.finishedAt = Date.now();
    await persist(state);
    return { ok: true };
  } catch (err) {
    job.status = 'error';
    job.error = err.message || String(err);
    job.finishedAt = Date.now();
    await persist(state);
    return { ok: false, error: job.error };
  }

  async function stopRequested() {
    // Re-read state to pick up stop signals written by the browser since we claimed
    // the job. Cheap: the state blob is small.
    try {
      const latest = await getState();
      return !!(latest && latest.jobControl && latest.jobControl.stop);
    } catch {
      return false;
    }
  }
}
