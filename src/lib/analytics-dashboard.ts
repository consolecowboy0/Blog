const API_BASE = '';
let authToken = localStorage.getItem('auth_token') || null;
let trendChart: any = null;
let chanChart: any = null;
let lastData: any = null;

const CH_ORDER = ['search', 'social', 'email', 'referral', 'direct', 'other'];
const CH_SHORT: Record<string, string> = {
  search: 'Search', social: 'Social', email: 'Email',
  referral: 'Referral', direct: 'Direct', other: 'Other',
};
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const gate = document.getElementById('gate')!;
const panel = document.getElementById('panel')!;
const gatePassword = document.getElementById('gate-password') as HTMLInputElement;
const gateError = document.getElementById('gate-error')!;
const rangeSelect = document.getElementById('range-select') as HTMLSelectElement;
const ownerInclude = document.getElementById('owner-include') as HTMLInputElement;
const stackToggle = document.getElementById('stack-toggle') as HTMLInputElement;
const loadingEl = document.getElementById('dash-loading')!;
const errorEl = document.getElementById('dash-error')!;
const bodyEl = document.getElementById('dash-body')!;

function showPanel() {
  gate.style.display = 'none';
  panel.style.display = 'block';
  loadData();
  loadSubscribers();
}

async function tryToken() {
  if (!authToken) return false;
  showPanel();
  return true;
}

async function unlock(e: Event) {
  e.preventDefault();
  const pw = gatePassword.value;
  try {
    const res = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, scope: 'analytics' }),
    });
    if (res.ok) {
      const data = await res.json();
      authToken = data.token;
      localStorage.setItem('auth_token', authToken!);
      gateError.classList.add('gate-hidden');
      gatePassword.value = '';
      showPanel();
    } else {
      gateError.textContent = res.status === 429 ? 'Too many attempts. Wait a bit.' : 'Wrong password';
      gateError.classList.remove('gate-hidden');
      gatePassword.value = '';
    }
  } catch {
    gateError.textContent = 'Auth failed.';
    gateError.classList.remove('gate-hidden');
  }
}

function signOut() {
  authToken = null;
  localStorage.removeItem('auth_token');
  panel.style.display = 'none';
  gate.style.display = 'flex';
  gatePassword.value = '';
}

async function loadData() {
  loadingEl.classList.remove('gate-hidden');
  errorEl.classList.add('gate-hidden');
  bodyEl.classList.add('gate-hidden');

  const range = rangeSelect.value;
  const span = /h$/.test(range) ? `hours=${parseInt(range, 10)}` : `days=${range}`;
  const owner = ownerInclude.checked ? '&owner=1' : '';
  try {
    const res = await fetch(`${API_BASE}/api/analytics?${span}${owner}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.status === 401) { signOut(); return; }
    if (!res.ok) throw new Error('Request failed (' + res.status + ')');
    const data = await res.json();
    lastData = data;
    render(data);
    loadingEl.classList.add('gate-hidden');
    bodyEl.classList.remove('gate-hidden');
  } catch (err: any) {
    loadingEl.classList.add('gate-hidden');
    errorEl.textContent = 'Could not load analytics: ' + (err?.message || err);
    errorEl.classList.remove('gate-hidden');
  }
}

function fmt(n: number) { return Number(n || 0).toLocaleString('en-US'); }
function pct(x: number) { return (x * 100).toFixed(x >= 0.1 ? 0 : 1) + '%'; }

function channelColors() {
  const cs = getComputedStyle(bodyEl);
  const map: Record<string, string> = {};
  for (const ch of CH_ORDER) map[ch] = (cs.getPropertyValue('--ch-' + ch).trim()) || '#888';
  return map;
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

async function render(data: any) {
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);
  const colors = channelColors();

  renderChannels(data, colors, Chart);
  renderSources(data, colors);
  renderGeography(data);
  renderSourceCities(data);
  renderCampaigns(data);
  renderTrend(data, colors, Chart);
  renderVolume(data);
  syncOwnerUI();
}

function renderChannels(data: any, colors: any, Chart: any) {
  const channels = data.channels || [];
  const subEl = document.getElementById('chan-sub')!;
  const stripEl = document.getElementById('chan-strip')!;
  const emptyEl = document.getElementById('chan-empty')!;
  const wrap = document.querySelector('.chan-bar-wrap') as HTMLElement;
  subEl.textContent = fmt(data.channelTotalViews) + ' qualified views';

  const sr = document.querySelector('#chan-sr tbody')!;

  if (!data.channelTotalViews) {
    emptyEl.classList.remove('gate-hidden');
    wrap.style.display = 'none';
    stripEl.innerHTML = '';
    sr.innerHTML = '';
    return;
  }

  emptyEl.classList.add('gate-hidden');
  wrap.style.display = 'block';
  const ds = channels.map((c: any) => ({
    label: c.label,
    data: [c.views],
    backgroundColor: colors[c.channel] || '#888',
    borderWidth: 0,
  }));
  const ctx = document.getElementById('chan-chart') as HTMLCanvasElement;
  if (chanChart) chanChart.destroy();
  chanChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: [''], datasets: ds },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      animation: RM ? false : { duration: 400 },
      scales: { x: { stacked: true, display: false }, y: { stacked: true, display: false } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (i: any) => `${ds[i.datasetIndex].label}: ${fmt(i.raw)} views` } },
      },
    },
  });

  stripEl.innerHTML = channels.map((c: any) =>
    `<div class="chan-cell" style="--c:${colors[c.channel]}">
      <div class="chan-top"><span class="chan-name">${escapeHtml(c.label)}</span><span class="chan-pct">${pct(c.pct)}</span></div>
      <span class="chan-count">${fmt(c.visitors)} visitors · ${fmt(c.views)} views</span>
    </div>`).join('');

  sr.innerHTML = channels.map((c: any) =>
    `<tr><td>${escapeHtml(c.label)}</td><td>${fmt(c.visitors)}</td><td>${fmt(c.views)}</td><td>${pct(c.pct)}</td></tr>`).join('');
}

function renderSources(data: any, colors: any) {
  const rows = data.topSources || [];
  const tbody = document.getElementById('sources-body')!;
  const empty = document.getElementById('sources-empty')!;
  document.getElementById('src-sub')!.textContent =
    rows.length ? `${fmt(rows.length)} shown` : '';

  if (!rows.length) {
    tbody.innerHTML = '';
    empty.classList.remove('gate-hidden');
    return;
  }
  empty.classList.add('gate-hidden');
  const max = rows[0].visitors || 1;
  let html = rows.map((r: any) => {
    const w = Math.max(2, Math.round((r.visitors / max) * 100));
    const col = colors[r.channel] || '#888';
    return `<tr>
      <td class="bar-cell">
        <span class="bar" style="width:${w}%;background:${col}"></span>
        <span class="lead-label" title="${escapeHtml(r.source)}">${escapeHtml(r.source)}</span>
        <span class="ch-chip" style="background:${col}">${escapeHtml(CH_SHORT[r.channel] || r.channel)}</span>
      </td>
      <td class="num">${fmt(r.visitors)}</td>
      <td class="num muted">${fmt(r.views)}</td>
    </tr>`;
  }).join('');
  if (data.sourcesOther && data.sourcesOther.count > 0) {
    html += `<tr class="row-other"><td>Other (${fmt(data.sourcesOther.count)} more)</td><td class="num"></td><td class="num">${fmt(data.sourcesOther.views)}</td></tr>`;
  }
  tbody.innerHTML = html;
}

function renderGeography(data: any) {
  const list = document.getElementById('geo-list')!;
  const empty = document.getElementById('geo-empty')!;
  const cover = document.getElementById('geo-cover')!;
  const sub = document.getElementById('geo-sub')!;
  const countries = data.topCountries || [];
  const geo = data.geo || { coverage: 0, unknownViews: 0, knownViews: 0 };

  sub.textContent = geo.knownViews ? `${fmt(geo.knownViews)} located views` : '';

  if (!countries.length) {
    list.innerHTML = '';
    empty.classList.remove('gate-hidden');
  } else {
    empty.classList.add('gate-hidden');
    const max = countries[0].visitors || 1;
    let html = countries.map((c: any) => {
      const w = Math.max(2, Math.round((c.visitors / max) * 100));
      return `<div class="geo-row">
        <span class="geo-flag">${escapeHtml(c.flag || '\u{1F310}')}</span>
        <span class="geo-mid"><span class="geo-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span><span class="geo-track"><span class="geo-bar" style="width:${w}%"></span></span></span>
        <span class="geo-count">${fmt(c.visitors)}</span>
      </div>`;
    }).join('');
    if (data.countriesOther && data.countriesOther.views > 0) {
      html += `<div class="geo-row muted"><span class="geo-flag">\u{1F5FA}\u{FE0F}</span><span class="geo-mid"><span class="geo-name">Other countries</span></span><span class="geo-count">${fmt(data.countriesOther.views)}v</span></div>`;
    }
    if (geo.unknownViews > 0) {
      html += `<div class="geo-row muted"><span class="geo-flag">\u{2753}</span><span class="geo-mid"><span class="geo-name">Unknown</span></span><span class="geo-count">${fmt(geo.unknownViews)}v</span></div>`;
    }
    list.innerHTML = html;
  }

  const regWrap = document.getElementById('region-wrap')!;
  const regList = document.getElementById('region-list')!;
  const regions = data.regions || [];
  if (regions.length) {
    const max = regions[0].visitors || 1;
    regList.innerHTML = regions.map((r: any) => {
      const w = Math.max(2, Math.round((r.visitors / max) * 100));
      const label = r.name || r.region;
      const title = r.country ? `${label}, ${r.country}` : label;
      return `<div class="geo-row">
        <span class="geo-flag">${escapeHtml(r.flag || '\u{1F310}')}</span>
        <span class="geo-mid"><span class="geo-name" title="${escapeHtml(title)}">${escapeHtml(label)}</span><span class="geo-track"><span class="geo-bar" style="width:${w}%"></span></span></span>
        <span class="geo-count">${fmt(r.visitors)}</span>
      </div>`;
    }).join('');
    regWrap.classList.remove('gate-hidden');
  } else {
    regWrap.classList.add('gate-hidden');
  }

  const cityWrap = document.getElementById('city-wrap')!;
  const cityList = document.getElementById('city-list')!;
  const cities = data.cities || [];
  if (cities.length) {
    const max = cities[0].visitors || 1;
    cityList.innerHTML = cities.map((c: any) => {
      const w = Math.max(2, Math.round((c.visitors / max) * 100));
      const tail = [c.region, c.country].filter(Boolean).join(', ');
      const label = tail ? `${c.city}, ${tail}` : c.city;
      return `<div class="geo-row">
        <span class="geo-flag">${escapeHtml(c.flag || '\u{1F310}')}</span>
        <span class="geo-mid"><span class="geo-name" title="${escapeHtml(label)}">${escapeHtml(c.city)}${tail ? `<span class="geo-sub">, ${escapeHtml(tail)}</span>` : ''}</span><span class="geo-track"><span class="geo-bar" style="width:${w}%"></span></span></span>
        <span class="geo-count">${fmt(c.visitors)}</span>
      </div>`;
    }).join('');
    cityWrap.classList.remove('gate-hidden');
  } else {
    cityWrap.classList.add('gate-hidden');
  }

  if (!geo.knownViews) {
    cover.textContent = '';
  } else {
    const parts = [`Geography known for ${pct(geo.coverage || 0)} of qualified views.`];
    if (data.dataEpoch) {
      const sinceStr = new Date(data.dataEpoch).toISOString().slice(0, 10);
      parts.push(`Collecting since ${sinceStr}; older views predate geo tracking.`);
    }
    cover.textContent = parts.join(' ');
  }
}

function renderSourceCities(data: any) {
  const block = document.getElementById('srccity-block')!;
  const select = document.getElementById('srccity-select') as HTMLSelectElement;
  const map = data.sourceCities || {};
  const sources = Object.keys(map)
    .map((s) => ({ s, total: (map[s] || []).reduce((n: number, c: any) => n + c.visitors, 0) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((x) => x.s);

  if (!sources.length) { block.classList.add('gate-hidden'); return; }
  block.classList.remove('gate-hidden');

  const prev = select.value;
  select.innerHTML = sources.map((s) =>
    `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
  if (sources.includes(prev)) select.value = prev;
  drawSourceCities(map[select.value] || []);
}

function drawSourceCities(cities: any[]) {
  const list = document.getElementById('srccity-list')!;
  const empty = document.getElementById('srccity-empty')!;
  if (!cities.length) {
    list.innerHTML = '';
    empty.classList.remove('gate-hidden');
    return;
  }
  empty.classList.add('gate-hidden');
  const max = cities[0].visitors || 1;
  list.innerHTML = cities.map((c: any) => {
    const w = Math.max(2, Math.round((c.visitors / max) * 100));
    const tail = [c.region, c.country].filter(Boolean).join(', ');
    const label = tail ? `${c.city}, ${tail}` : c.city;
    return `<div class="geo-row">
      <span class="geo-flag">${escapeHtml(c.flag || '\u{1F310}')}</span>
      <span class="geo-mid"><span class="geo-name" title="${escapeHtml(label)}">${escapeHtml(c.city)}${tail ? `<span class="geo-sub">, ${escapeHtml(tail)}</span>` : ''}</span><span class="geo-track"><span class="geo-bar" style="width:${w}%"></span></span></span>
      <span class="geo-count">${fmt(c.visitors)}</span>
    </div>`;
  }).join('');
}

document.getElementById('srccity-select')!.addEventListener('change', () => {
  if (lastData && lastData.sourceCities) {
    drawSourceCities(lastData.sourceCities[(document.getElementById('srccity-select') as HTMLSelectElement).value] || []);
  }
});

function renderCampaigns(data: any) {
  const tbody = document.getElementById('campaign-body')!;
  const table = document.getElementById('campaign-table')!;
  const empty = document.getElementById('campaign-empty')!;
  const rows = data.topCampaigns || [];
  if (!rows.length) {
    table.classList.add('gate-hidden');
    empty.classList.remove('gate-hidden');
    tbody.innerHTML = '';
    return;
  }
  table.classList.remove('gate-hidden');
  empty.classList.add('gate-hidden');
  const colors = channelColors();
  tbody.innerHTML = rows.map((r: any) => {
    const col = colors[r.channel] || '#888';
    const sm = [r.source, r.medium].filter(Boolean).map(escapeHtml).join(' / ') || '—';
    return `<tr>
      <td><span class="lead-label" title="${escapeHtml(r.campaign)}">${escapeHtml(r.campaign)}</span></td>
      <td class="muted"><span class="ch-chip" style="background:${col}">${escapeHtml(CH_SHORT[r.channel] || r.channel)}</span> ${sm}</td>
      <td class="num">${fmt(r.visitors)}</td>
      <td class="num muted">${fmt(r.views)}</td>
    </tr>`;
  }).join('');
}

function renderTrend(data: any, colors: any, Chart: any) {
  const ctx = document.getElementById('trend-chart') as HTMLCanvasElement;
  const stacked = stackToggle.checked;
  if (trendChart) trendChart.destroy();

  const hourly = data.bucket === 'hour';
  const labels = data.series.map((d: any) =>
    hourly ? d.day.slice(11) + ':00' : d.day.slice(5));
  let datasets;
  let yStacked = false;

  if (stacked && data.channelSeries) {
    yStacked = true;
    datasets = CH_ORDER.map((ch) => ({
      label: CH_SHORT[ch] + ' views',
      data: data.channelSeries.map((r: any) => r[ch] || 0),
      backgroundColor: (colors[ch] || '#888') + '55',
      borderColor: colors[ch] || '#888',
      borderWidth: 1, fill: true, tension: 0.25, pointRadius: 0,
    }));
  } else {
    datasets = [
      { label: 'Pageviews', data: data.series.map((d: any) => d.views), borderColor: '#4663ff', backgroundColor: 'rgba(70,99,255,0.12)', fill: true, tension: 0.3, pointRadius: 2 },
      { label: hourly ? 'Hourly visits' : 'Daily visits', data: data.series.map((d: any) => d.visitors), borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.10)', fill: true, tension: 0.3, pointRadius: 2 },
    ];
  }

  trendChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: RM ? false : { duration: 400 },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { font: { family: 'Inter, sans-serif' }, boxWidth: 12 } } },
      scales: {
        x: { stacked: yStacked, ticks: { maxTicksLimit: 12, font: { family: 'Inter, sans-serif' } } },
        y: { stacked: yStacked, beginAtZero: true, ticks: { precision: 0, font: { family: 'Inter, sans-serif' } } },
      },
    },
  });

  const epochNote = document.getElementById('epoch-note')!;
  if (data.dataEpoch) {
    epochNote.textContent = `Channels, geography and campaigns tracked since ${new Date(data.dataEpoch).toISOString().slice(0, 10)}. Earlier days show pageviews only.`;
    epochNote.classList.remove('gate-hidden');
  } else {
    epochNote.classList.add('gate-hidden');
  }
}

function renderVolume(data: any) {
  document.getElementById('stat-views')!.textContent = fmt(data.totals.views);
  document.getElementById('stat-visitors')!.textContent = fmt(data.totals.visitors);

  const pathsBody = document.getElementById('paths-body')!;
  pathsBody.innerHTML = (data.topPaths && data.topPaths.length)
    ? data.topPaths.map((p: any) =>
        `<tr><td class="bar-cell"><span class="lead-label" title="${escapeHtml(p.path)}">${escapeHtml(p.path)}</span></td><td class="num">${fmt(p.views)}</td></tr>`).join('')
    : '<tr><td>No data yet</td><td></td></tr>';
}

function syncOwnerUI() {
  const marked = (() => { try { return localStorage.getItem('analytics_owner') === '1'; } catch { return false; } })();
  const btn = document.getElementById('mark-owner') as HTMLButtonElement;
  const hint = document.getElementById('owner-hint')!;
  if (marked) {
    btn.textContent = 'Marked ✓';
    hint.textContent = 'This browser is tagged. Its visits drop out unless "Include my visits" is on.';
  } else {
    btn.textContent = 'This is me';
    hint.textContent = 'Tag this browser so its visits drop out of the breakdowns.';
  }
}

function markOwner() {
  try { localStorage.setItem('analytics_owner', '1'); } catch {}
  syncOwnerUI();
}

document.getElementById('gate-form')!.addEventListener('submit', unlock);
document.getElementById('sign-out')!.addEventListener('click', signOut);
document.getElementById('mark-owner')!.addEventListener('click', markOwner);
rangeSelect.addEventListener('change', loadData);
ownerInclude.addEventListener('change', loadData);
stackToggle.addEventListener('change', () => { if (lastData) renderTrendOnly(); });

async function renderTrendOnly() {
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);
  renderTrend(lastData, channelColors(), Chart);
}

new MutationObserver(() => { if (lastData && panel.style.display !== 'none') render(lastData); })
  .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// --- Subscribers ---------------------------------------------------------
const SUB_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let subscribers: any[] = [];

function authHeaders() { return { Authorization: `Bearer ${authToken}` }; }

function setSubError(msg: string) {
  const el = document.getElementById('subs-error')!;
  el.textContent = msg;
  el.classList.remove('gate-hidden');
}
function clearSubError() { document.getElementById('subs-error')!.classList.add('gate-hidden'); }

function fmtDate(ms: number) {
  if (!ms) return '—';
  return new Date(ms).toISOString().slice(0, 10);
}

async function loadSubscribers() {
  const loading = document.getElementById('subs-loading')!;
  loading.textContent = 'Loading…';
  loading.classList.remove('gate-hidden');
  try {
    const res = await fetch(`${API_BASE}/api/subscribers`, { headers: authHeaders() });
    if (res.status === 401) { signOut(); return; }
    if (!res.ok) throw new Error('Request failed (' + res.status + ')');
    const data = await res.json();
    subscribers = data.subscribers || [];
    renderSubscribers();
  } catch (err: any) {
    loading.textContent = 'Could not load subscribers: ' + (err?.message || err);
  }
}

function renderSubscribers() {
  const loading = document.getElementById('subs-loading')!;
  const empty = document.getElementById('subs-empty')!;
  const body = document.getElementById('subs-body')!;
  const sub = document.getElementById('subs-sub')!;
  loading.classList.add('gate-hidden');
  sub.textContent = subscribers.length ? `${fmt(subscribers.length)} total` : '';
  if (!subscribers.length) {
    body.innerHTML = '';
    empty.classList.remove('gate-hidden');
    return;
  }
  empty.classList.add('gate-hidden');
  body.innerHTML = subscribers.map((s: any) => `
    <tr data-id="${escapeHtml(s.id)}">
      <td class="bar-cell"><span class="lead-label" title="${escapeHtml(s.email)}">${escapeHtml(s.email)}</span></td>
      <td class="muted">${escapeHtml(s.source || '—')}</td>
      <td class="num muted">${fmtDate(s.created)}</td>
      <td class="num"><div class="subs-actions">
        <button type="button" class="subs-btn sub-edit">Edit</button>
        <button type="button" class="subs-btn danger sub-del">Delete</button>
      </div></td>
    </tr>`).join('');
}

function startEdit(tr: HTMLElement, id: string) {
  const s = subscribers.find((x: any) => x.id === id);
  if (!s) return;
  const emailCell = tr.querySelector('td')!;
  emailCell.innerHTML = `<input class="subs-edit-input" type="email" value="${escapeHtml(s.email)}" />`;
  const actions = tr.querySelector('.subs-actions')!;
  actions.innerHTML =
    `<button type="button" class="subs-btn sub-save">Save</button>` +
    `<button type="button" class="subs-btn sub-cancel">Cancel</button>`;
  const input = emailCell.querySelector('input') as HTMLInputElement;
  input.focus();
  input.select();
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(id, input.value); }
    else if (e.key === 'Escape') { renderSubscribers(); }
  });
}

async function saveEdit(id: string, raw: string) {
  const email = raw.trim().toLowerCase();
  if (!SUB_EMAIL_RE.test(email)) { setSubError('Invalid email'); return; }
  try {
    const res = await fetch(`${API_BASE}/api/subscribers`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, email }),
    });
    if (res.status === 401) { signOut(); return; }
    const data = await res.json();
    if (!res.ok) { setSubError(data.error || 'Could not save'); return; }
    clearSubError();
    await loadSubscribers();
  } catch { setSubError('Could not save'); }
}

async function deleteSubscriber(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/subscribers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.status === 401) { signOut(); return; }
    if (!res.ok) { const d = await res.json().catch(() => ({})); setSubError(d.error || 'Could not delete'); return; }
    clearSubError();
    await loadSubscribers();
  } catch { setSubError('Could not delete'); }
}

document.getElementById('subs-body')!.addEventListener('click', (e: Event) => {
  const target = e.target as HTMLElement;
  const tr = target.closest('tr') as HTMLElement | null;
  if (!tr) return;
  const id = tr.getAttribute('data-id') || '';
  if (target.classList.contains('sub-del')) {
    const s = subscribers.find((x: any) => x.id === id);
    if (confirm(`Remove ${s?.email || 'this subscriber'} from the list?`)) deleteSubscriber(id);
  } else if (target.classList.contains('sub-edit')) {
    startEdit(tr, id);
  } else if (target.classList.contains('sub-save')) {
    const input = tr.querySelector('.subs-edit-input') as HTMLInputElement;
    saveEdit(id, input.value);
  } else if (target.classList.contains('sub-cancel')) {
    renderSubscribers();
  }
});

document.getElementById('subs-add-form')!.addEventListener('submit', async (e: Event) => {
  e.preventDefault();
  const input = document.getElementById('subs-add-email') as HTMLInputElement;
  const email = input.value.trim().toLowerCase();
  if (!SUB_EMAIL_RE.test(email)) { setSubError('Invalid email'); return; }
  try {
    const res = await fetch(`${API_BASE}/api/subscribers`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.status === 401) { signOut(); return; }
    const data = await res.json();
    if (!res.ok) { setSubError(data.error || 'Could not add'); return; }
    clearSubError();
    input.value = '';
    await loadSubscribers();
  } catch { setSubError('Could not add'); }
});

tryToken();
