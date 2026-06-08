const API = '/api/mimir';

function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 8);
}

function getFingerprint(): string {
  return [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    String(navigator.hardwareConcurrency || 0),
    navigator.platform,
  ].join('|');
}

const fingerprint = getFingerprint();
let visitorId = localStorage.getItem('mimir_visitor_id') || localStorage.getItem('dm_visitor_id') || djb2(fingerprint);
localStorage.setItem('mimir_visitor_id', visitorId);

const idEl = document.getElementById('visitor-id')!;
const copyBtn = document.getElementById('copy-id')!;
const resumeToggle = document.getElementById('resume-toggle')!;
const resumeForm = document.getElementById('resume-form')!;
const resumeInput = document.getElementById('resume-input') as HTMLInputElement;
const resumeBtn = document.getElementById('resume-btn')!;
const messagesEl = document.getElementById('messages')!;
const msgInput = document.getElementById('msg-input') as HTMLTextAreaElement;
const sendBtn = document.getElementById('send-btn')!;

idEl.textContent = visitorId;

let lastMsgCount = 0;
let lastMsgTime = 0;
let lastSendTime = 0;

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(visitorId);
  copyBtn.classList.add('copied');
  copyBtn.title = 'Copied!';
  setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.title = 'Copy ID'; }, 1500);
});

resumeToggle.addEventListener('click', () => {
  resumeForm.classList.toggle('resume-hidden');
  if (!resumeForm.classList.contains('resume-hidden')) resumeInput.focus();
});

resumeBtn.addEventListener('click', () => {
  const newId = resumeInput.value.trim();
  if (!newId) return;
  visitorId = newId;
  localStorage.setItem('mimir_visitor_id', visitorId);
  idEl.textContent = visitorId;
  resumeForm.classList.add('resume-hidden');
  resumeInput.value = '';
  lastMsgCount = 0;
  loadMessages();
});

resumeInput.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') resumeBtn.click();
});

function esc(str: string): string {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

function fmtTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function renderBubble(m: { from: string; text: string; time: number }): string {
  const cls = m.from === 'admin' ? 'msg-admin' : 'msg-visitor';
  return `<div class="msg ${cls}"><div class="msg-text">${esc(m.text)}</div><span class="msg-time">${fmtTime(m.time)}</span></div>`;
}

function render(messages: Array<{ from: string; text: string; time: number }>) {
  if (!messages.length) {
    messagesEl.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z"></path></svg></div><p class="empty-title">No messages yet</p><p class="empty-sub">Start the conversation below.</p></div>`;
    lastMsgCount = 0;
    lastMsgTime = 0;
    return;
  }
  messagesEl.innerHTML = messages.map(renderBubble).join('');
  messagesEl.scrollTop = messagesEl.scrollHeight;
  lastMsgCount = messages.length;
  lastMsgTime = messages[messages.length - 1].time;
}

function appendLocal(text: string, from: string) {
  const empty = messagesEl.querySelector('.empty-state');
  if (empty) empty.remove();
  const now = Date.now();
  const div = document.createElement('div');
  div.innerHTML = renderBubble({ from, text, time: now });
  messagesEl.appendChild(div.firstElementChild!);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  lastMsgCount++;
  lastMsgTime = now;
}

async function loadMessages() {
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'poll', visitor_id: visitorId }),
    });
    if (res.ok) {
      const data = await res.json();
      const msgs = data.messages || [];
      const serverLastTime = msgs.length > 0 ? msgs[msgs.length - 1].time : 0;
      if (msgs.length !== lastMsgCount || serverLastTime !== lastMsgTime) {
        render(msgs);
      }
    }
  } catch { /* silent */ }
}

async function send() {
  const text = msgInput.value.trim();
  if (!text) return;

  msgInput.value = '';
  appendLocal(text, 'visitor');
  lastSendTime = Date.now();

  sendBtn.setAttribute('disabled', '');
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', visitor_id: visitorId, text, fingerprint }),
    });
  } catch { /* silent */ }
  sendBtn.removeAttribute('disabled');
  msgInput.focus();
}

sendBtn.addEventListener('click', send);
msgInput.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

msgInput.addEventListener('input', () => {
  msgInput.style.height = 'auto';
  msgInput.style.height = Math.min(msgInput.scrollHeight, 128) + 'px';
  sendBtn.toggleAttribute('disabled', !msgInput.value.trim());
});

loadMessages();
let pollTimer: ReturnType<typeof setTimeout>;
function schedulePoll() {
  const interval = (Date.now() - lastSendTime) < 120000 ? 3000 : 15000;
  pollTimer = setTimeout(async () => {
    await loadMessages();
    schedulePoll();
  }, interval);
}
schedulePoll();
