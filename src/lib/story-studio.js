var API_BASE = location.hostname === 'localhost' ? '' : 'https://api.dustinlanders.com';
var authToken = localStorage.getItem('auth_token') || null;
var COLORS = ['#e05252','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#14b8a6','#a855f7'];
var LS_KEY = 'story_studio_state';

var state = { chars: [], setting: '', direction: '', transcript: [] };
var running = false;
var stopRequested = false;

var charList = document.getElementById('char-list');
var settingEl = document.getElementById('setting');
var directionEl = document.getElementById('direction');
var transcriptEl = document.getElementById('transcript');
var transcriptEmpty = document.getElementById('transcript-empty');
var runBtn = document.getElementById('run-btn');
var stopBtn = document.getElementById('stop-btn');
var runError = document.getElementById('run-error');

function uid() { return Math.random().toString(36).slice(2, 9); }

function load() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (raw) {
      var saved = JSON.parse(raw);
      state.chars = Array.isArray(saved.chars) ? saved.chars : [];
      state.setting = saved.setting || '';
      state.direction = saved.direction || '';
      state.transcript = Array.isArray(saved.transcript) ? saved.transcript : [];
    }
  } catch (e) {}
  if (state.chars.length === 0) {
    state.chars = [{ id: uid(), name: '', desc: '', goal: '' }, { id: uid(), name: '', desc: '', goal: '' }];
  }
}

function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
}

function colorFor(idx) { return COLORS[idx % COLORS.length]; }

function nowString() {
  try {
    var d = new Date();
    var day = d.toLocaleDateString(undefined, { weekday: 'long' });
    var t = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return day + ', ' + t;
  } catch (e) { return new Date().toLocaleTimeString(); }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function renderChars() {
  charList.innerHTML = '';
  state.chars.forEach(function (c, idx) {
    var card = document.createElement('div');
    card.className = 'char-card';
    card.style.setProperty('--c', colorFor(idx));
    card.innerHTML =
      '<div class="char-card-top">' +
        '<span class="char-dot" style="background:' + colorFor(idx) + '"></span>' +
        '<input class="char-name" type="text" placeholder="Name" value="' + escapeHtml(c.name) + '" />' +
        '<button type="button" class="char-del">Remove</button>' +
      '</div>' +
      '<textarea class="char-desc" rows="4" placeholder="Who are they? Voice, mood, wants, history...">' + escapeHtml(c.desc) + '</textarea>' +
      '<input class="char-goal" type="text" placeholder="Goal (private): one small thing they want in this scene. e.g. get the briefcase before the train leaves" value="' + escapeHtml(c.goal || '') + '" />';
    var nameInput = card.querySelector('.char-name');
    var descInput = card.querySelector('.char-desc');
    var goalInput = card.querySelector('.char-goal');
    nameInput.addEventListener('input', function () { c.name = nameInput.value; save(); });
    descInput.addEventListener('input', function () { c.desc = descInput.value; save(); });
    goalInput.addEventListener('input', function () { c.goal = goalInput.value; save(); });
    card.querySelector('.char-del').addEventListener('click', function () {
      state.chars = state.chars.filter(function (x) { return x.id !== c.id; });
      renderChars(); save();
    });
    charList.appendChild(card);
  });
}

document.getElementById('add-char').addEventListener('click', function () {
  state.chars.push({ id: uid(), name: '', desc: '', goal: '' });
  renderChars(); save();
});

settingEl.addEventListener('input', function () { state.setting = settingEl.value; save(); });
directionEl.addEventListener('input', function () { state.direction = directionEl.value; save(); });

function renderTranscript() {
  transcriptEl.innerHTML = '';
  if (state.transcript.length === 0) {
    transcriptEmpty.classList.remove('gate-hidden');
  } else {
    transcriptEmpty.classList.add('gate-hidden');
  }
  state.transcript.forEach(function (b) {
    transcriptEl.appendChild(beatNode(b));
  });
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

function beatNode(b) {
  var el = document.createElement('div');
  if (b.kind === 'director') {
    el.className = 'beat director';
    el.innerHTML = '<div class="beat-name">Director</div><div class="beat-text">' + escapeHtml(b.text) + '</div>';
  } else if (b.kind === 'orchestrator') {
    el.className = 'beat orchestrator';
    el.innerHTML = '<div class="beat-name">Orchestrator</div><div class="beat-text">' + escapeHtml(b.text) + '</div>';
  } else {
    el.className = 'beat ' + (b.format || 'screenplay');
    var color = colorFor(charIndex(b.name));
    el.style.setProperty('--c', color);
    el.innerHTML = '<div class="beat-name">' + escapeHtml(b.name) + '</div><div class="beat-text">' + escapeHtml(b.text) + '</div>';
  }
  return el;
}

function charIndex(name) {
  for (var i = 0; i < state.chars.length; i++) {
    if (state.chars[i].name === name) return i;
  }
  return 0;
}

function addBeat(beat) {
  state.transcript.push(beat);
  transcriptEmpty.classList.add('gate-hidden');
  var node = beatNode(beat);
  transcriptEl.appendChild(node);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
  save();
  return node;
}

function sceneSoFar() {
  if (state.transcript.length === 0) return '';
  return state.transcript
    .filter(function (b) { return b.kind !== 'orchestrator'; })
    .map(function (b) {
      if (b.kind === 'director') return '[' + b.text + ']';
      return b.name + ': ' + b.text;
    }).join('\n\n');
}

function latestDirection() {
  for (var i = state.transcript.length - 1; i >= 0; i--) {
    if (state.transcript[i].kind === 'orchestrator') return state.transcript[i].text;
  }
  return '';
}

function orchestratorSystem() {
  var s = 'You are the ORCHESTRATOR: the showrunner and director of a collaborative fiction scene. You never write dialogue and you never speak as a character. Your only job is to keep the scene on track and moving.\n\n';
  s += 'You will be given the target direction the writer wants, the cast and their private goals, the setting, the scene so far, and where we are in the arc.\n\n';
  s += 'Output ONE short note to the writers room: at most two sentences, under 40 words. Make it concrete and actionable -- name what should happen in the next beats to serve the story: what to escalate, which thread to pay off, what to stop circling, when to force a turn or land the ending. ';
  s += 'Steer toward the target direction when one is given; if none is given, keep the scene coherent, escalating, and building to a real turn. ';
  s += 'You may use the private character goals to steer, but never reveal or name any private goal in your note. ';
  s += 'Give direction for what should happen next; do not narrate events as if they already happened, do not write dialogue, do not use a label or preamble. Just the note.';
  return s;
}

function orchestratorMessages(r, rounds) {
  var dir = (state.direction || '').trim();
  var cast = state.chars
    .filter(function (c) { return c.name.trim() || c.desc.trim(); })
    .map(function (c) {
      var line = '- ' + (c.name || 'Unnamed') + ': ' + (c.desc || 'no description').replace(/\s+/g, ' ').trim();
      if ((c.goal || '').trim()) line += ' [private goal: ' + c.goal.trim() + ']';
      return line;
    }).join('\n');
  var scene = sceneSoFar();
  var phase = (rounds <= 1 || r === 0) ? 'opening' : (r >= rounds - 1) ? 'final' : 'middle';

  var content = 'TARGET DIRECTION (the shape the writer wants): ' + (dir || '(none given -- keep it coherent, escalating, and building to a real turn)') + '\n\n';
  content += 'CAST:\n' + (cast || '(none)') + '\n\n';
  if (state.setting.trim()) content += 'SETTING:\n' + state.setting.trim() + '\n\n';
  content += 'SCENE SO FAR:\n' + (scene || '(not started yet)') + '\n\n';
  content += 'ARC POSITION: round ' + (r + 1) + ' of ' + rounds + ' (' + phase + ').\n\n';
  content += 'Write the orchestrator note for the next beats now.';
  return [{ role: 'user', content: content }];
}

function systemFor(char) {
  var format = document.getElementById('format-select').value;
  var others = state.chars
    .filter(function (c) { return c.id !== char.id && c.name.trim(); })
    .map(function (c) { return c.name; });
  var s = 'You are writing one character in a collaborative fiction scene, for a creative-writing tool. Stay fully in character at all times.\n\n';
  s += 'YOUR CHARACTER: ' + (char.name || 'Unnamed') + '\n';
  s += (char.desc || 'No description given. Invent a consistent, vivid persona.') + '\n\n';
  if ((char.goal || '').trim()) {
    s += 'WHAT YOU WANT (your private objective; drive toward it, do not announce it): ' + char.goal.trim() + '\n';
    s += 'Pursue it through tactics: charm, stall, probe, lie, change the subject. You may only state it outright if you are cornered. Let it shape every choice without saying it.\n\n';
  }
  if (state.setting.trim()) s += 'SETTING:\n' + state.setting.trim() + '\n\n';
  if (others.length) s += 'OTHER CHARACTERS PRESENT: ' + others.join(', ') + '\n\n';

  if (format === 'comic') {
    s += 'FORMAT: comic book panel. Write your beat as ONE punchy line of dialogue, the kind that fits in a speech bubble. You may add at most one short action caption in [brackets]. One panel only. Make it land.\n\n';
  } else {
    s += 'FORMAT: screenplay. Write your beat as tight spoken dialogue, mostly what they say out loud. Put any action in a brief stage direction in (parentheses), and only when it matters. One to three lines, never a paragraph.\n\n';
  }

  s += 'Write ' + (char.name || 'your character') + "'s next beat, reacting to what just happened. ";
  s += 'Keep it SHORT and conversational. Trade lines fast, like a real back-and-forth, and leave room for the others to answer. ';
  s += 'Write ONLY your own dialogue and actions. Never speak or act for the other characters. Do not narrate from an omniscient view. ';
  s += 'Do not prefix your reply with your name or any label.';
  return s;
}

function messagesFor(char, r, rounds) {
  var scene = sceneSoFar();
  var content;
  if (scene) {
    content = 'SCENE SO FAR:\n\n' + scene + '\n\nContinue the scene now as ' + (char.name || 'your character') + '. Write only their next beat.';
  } else {
    content = 'The scene is just opening. Write ' + (char.name || 'your character') + "'s first beat to set it in motion.";
  }

  if (typeof r === 'number' && typeof rounds === 'number') {
    var phase = (rounds <= 1 || r === 0) ? 'open' : (r >= rounds - 1) ? 'final' : 'mid';
    if (phase === 'open') content += '\n\nThis is the opening: establish what you want and stake your ground. Do not resolve anything yet.';
    else if (phase === 'final') content += '\n\nThis is the FINAL exchange of the scene: push toward a turn, a decision, or a breaking point. Do not open new threads or leave it dangling.';
    else content += '\n\nThe scene is building: raise the stakes, force the issue, do not reset to small talk.';
  }

  var orchEl = document.getElementById('orchestrate');
  if (!orchEl || orchEl.checked) {
    var dir = latestDirection();
    if (dir) content += "\n\nDIRECTION (the orchestrator's note to the room for this moment; honor it in what you choose to do, but do not quote or mention it): " + dir;
  }

  var timeEl = document.getElementById('use-time');
  if (!timeEl || timeEl.checked) {
    content += '\n\nIt is ' + nowString() + ' right now, in the real world and in this scene. Time is moving; let it press on what you do.';
  }

  return [{ role: 'user', content: content }];
}

function stripLabel(text, name) {
  var t = (text || '').trim();
  if (name) {
    var re = new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[:\\-\\u2014]\\s*', 'i');
    t = t.replace(re, '');
  }
  return t.trim();
}

async function ask(system, messages, maxOverride) {
  var model = document.getElementById('model-select').value;
  var maxTok = maxOverride || parseInt(document.getElementById('length-select').value, 10) || 600;
  var headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
  var res = await fetch(API_BASE + '/api/story-chat', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ system: system, messages: messages, model: model, max_tokens: maxTok }),
  });
  if (res.status === 401) { signOut(); throw new Error('Session expired. Sign in again.'); }
  if (!res.ok) {
    var err = '';
    try { var b = await res.json(); err = b.error || JSON.stringify(b); } catch (e) { try { err = await res.text(); } catch (e2) {} }
    throw new Error('Story error (' + res.status + '): ' + (err || 'unknown'));
  }
  var data = await res.json();
  return data.text;
}

function setRunning(on) {
  running = on;
  runBtn.disabled = on;
  runBtn.textContent = on ? 'Running...' : 'Run scene';
  stopBtn.classList.toggle('gate-hidden', !on);
}

function shuffle(a) {
  var arr = a.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

async function run() {
  if (running) return;
  runError.classList.add('gate-hidden');
  var active = state.chars.filter(function (c) { return c.name.trim() || c.desc.trim(); });
  if (active.length === 0) {
    runError.textContent = 'Add at least one character first.';
    runError.classList.remove('gate-hidden');
    return;
  }
  var rounds = Math.min(20, Math.max(1, parseInt(document.getElementById('rounds').value, 10) || 1));
  var order = document.getElementById('order-select').value;
  var format = document.getElementById('format-select').value;
  var orchEl = document.getElementById('orchestrate');
  var orchOn = !orchEl || orchEl.checked;
  stopRequested = false;
  setRunning(true);

  try {
    for (var r = 0; r < rounds && !stopRequested; r++) {
      if (orchOn && !stopRequested) {
        var oThinking = addBeat({ kind: 'orchestrator', text: '...' });
        oThinking.classList.add('thinking');
        state.transcript.pop();
        var note;
        try {
          note = await ask(orchestratorSystem(), orchestratorMessages(r, rounds), 240);
        } catch (e) {
          oThinking.remove();
          throw e;
        }
        oThinking.remove();
        note = (note || '').trim();
        if (note) addBeat({ kind: 'orchestrator', text: note });
      }
      var lineup = order === 'random' ? shuffle(active) : active;
      for (var i = 0; i < lineup.length && !stopRequested; i++) {
        var char = lineup[i];
        var thinking = addBeat({ kind: 'thinking', name: char.name || 'Unnamed', text: '...', format: format });
        thinking.classList.add('thinking');
        state.transcript.pop();
        var text;
        try {
          text = await ask(systemFor(char), messagesFor(char, r, rounds));
        } catch (e) {
          thinking.remove();
          throw e;
        }
        thinking.remove();
        text = stripLabel(text, char.name);
        if (text) addBeat({ kind: 'char', name: char.name || 'Unnamed', text: text, format: format });
      }
    }
  } catch (e) {
    runError.textContent = e.message || String(e);
    runError.classList.remove('gate-hidden');
  } finally {
    setRunning(false);
  }
}

runBtn.addEventListener('click', run);
stopBtn.addEventListener('click', function () { stopRequested = true; });

document.getElementById('nudge-btn').addEventListener('click', function () {
  var input = document.getElementById('nudge');
  var v = input.value.trim();
  if (!v) return;
  addBeat({ kind: 'director', text: v });
  input.value = '';
});
document.getElementById('nudge').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('nudge-btn').click(); }
});

document.getElementById('clear-btn').addEventListener('click', function () {
  if (state.transcript.length && !confirm('Clear the whole scene? Characters and setting stay.')) return;
  state.transcript = [];
  renderTranscript(); save();
});

document.getElementById('copy-btn').addEventListener('click', function () {
  var text = state.transcript
    .filter(function (b) { return b.kind !== 'orchestrator'; })
    .map(function (b) {
      return b.kind === 'director' ? '[' + b.text + ']' : b.name + ': ' + b.text;
    }).join('\n\n');
  navigator.clipboard.writeText(text).then(function () {
    var btn = document.getElementById('copy-btn');
    var old = btn.textContent; btn.textContent = 'Copied';
    setTimeout(function () { btn.textContent = old; }, 1200);
  }).catch(function () {});
});

function show() {
  document.getElementById('gate').style.display = 'none';
  document.getElementById('panel').style.display = 'block';
  load();
  renderChars();
  settingEl.value = state.setting;
  directionEl.value = state.direction;
  renderTranscript();
}

function signOut() {
  authToken = null;
  localStorage.removeItem('auth_token');
  document.getElementById('panel').style.display = 'none';
  document.getElementById('gate').style.display = 'flex';
  document.getElementById('gate-password').value = '';
  document.getElementById('gate-error').classList.add('gate-hidden');
}

if (authToken) show();

document.getElementById('gate-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  var pw = document.getElementById('gate-password').value;
  var errEl = document.getElementById('gate-error');
  errEl.classList.add('gate-hidden');
  try {
    var res = await fetch(API_BASE + '/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, scope: 'analytics' }),
    });
    var data = await res.json();
    if (res.ok && data.token) {
      authToken = data.token;
      localStorage.setItem('auth_token', authToken);
      show();
    } else {
      errEl.textContent = res.status === 429 ? 'Too many attempts. Wait a bit.' : 'Wrong password';
      errEl.classList.remove('gate-hidden');
      document.getElementById('gate-password').value = '';
    }
  } catch (e) {
    errEl.textContent = 'Auth failed.';
    errEl.classList.remove('gate-hidden');
    document.getElementById('gate-password').value = '';
  }
});

document.getElementById('sign-out').addEventListener('click', signOut);
