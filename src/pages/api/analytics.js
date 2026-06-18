export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { getDb } from '../../lib/firebase.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';
import { secureHeaders } from '../../lib/api-security.js';
import {
  classifyChannel, sourceLabel, CHANNELS, CHANNEL_LABELS,
  flagEmoji, isSpamHost, isPlausibleHost, CC_NAME, regionLabel,
} from '../../lib/channels.js';

// Returns aggregated pageview stats for the dashboard, focused on WHERE
// visitors come from: acquisition channels, granular sources, geography, and
// UTM campaigns. Channels/sources are classified at read time from raw stored
// signals, so one deploy reclassifies all history. Auth: scope "analytics".
// Query params: ?days=30 (1..90), ?owner=1 to include the owner's own visits.

// A visit that should paint the where-from breakdowns: looks human, is not the
// owner (unless asked), and is not referrer spam. Old docs predate the `human`
// flag; missing `human` is treated as human (can't be re-judged after the fact).
function countsAsTraffic(d, includeOwner) {
  if (d.human === 0) return false;                 // explicitly bot-ish
  if (!includeOwner && d.own === 1) return false;  // owner's own visits
  if (d.ref && isSpamHost(d.ref)) return false;    // referrer spam
  if (d.ref && !isPlausibleHost(d.ref)) return false;
  return true;
}

export async function GET({ request }) {
  const corsHeaders = corsHeadersFor(request, 'GET, OPTIONS');

  const auth = requireAuth(request, 'analytics');
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);
  let days = parseInt(url.searchParams.get('days') || '30', 10);
  if (!Number.isFinite(days) || days < 1) days = 30;
  if (days > 90) days = 90;
  const includeOwner = url.searchParams.get('owner') === '1';

  // Sub-day windows: ?hours=1|12|24 takes precedence over ?days and switches the
  // trend chart to hourly buckets. Aggregates (channels/sources/geo/…) just key
  // off `since`, so they need no special-casing.
  let hours = parseInt(url.searchParams.get('hours') || '', 10);
  if (!Number.isFinite(hours) || hours < 1) hours = null;
  else if (hours > 48) hours = 48;
  const hourly = hours != null;

  const since = hourly
    ? Date.now() - hours * 60 * 60 * 1000
    : Date.now() - days * 24 * 60 * 60 * 1000;

  try {
    const db = getDb();
    const snap = await db
      .collection('pageviews')
      .where('ts', '>=', since)
      .get();

    // ms timestamp of the first deploy carrying geo/UTM/channel data. Lets the
    // dashboard shade the trend before this point. 0 = unset (no seam drawn).
    const DATA_EPOCH = parseInt(
      process.env.ANALYTICS_DATA_EPOCH || import.meta.env.ANALYTICS_DATA_EPOCH || '0', 10
    ) || 0;

    let total = 0;
    const visitors = new Set();
    const byDay = new Map();       // bucket -> { views, visitors:Set } (day, or hour when hourly)
    const byPath = new Map();      // path -> views                    (all traffic)

    const byChannel = new Map();   // channel -> { views, visitors:Set }
    const bySource = new Map();    // label -> { views, visitors:Set, chanTally:Map }
    const byRef = new Map();       // referrer host -> views (legacy topReferrers)
    const byCountry = new Map();   // co -> { views, visitors:Set, name }
    const byRegion = new Map();    // `${co}|${reg}` -> { co, reg, name, views, visitors:Set }
    const byCity = new Map();      // `${co}|${city}` -> { co, city, country, views, visitors:Set }
    const bySourceCity = new Map(); // source label -> Map(`${co}|${city}` -> { co, city, country, reg, regn, views, visitors:Set })
    const byCampaign = new Map();  // campaign -> { views, visitors:Set, source, medium }
    const channelSeriesMap = new Map(); // day -> Map(channel -> Set vid)

    let geoTotalViews = 0, geoKnownViews = 0; // coverage denominators
    let channelTotalViews = 0;
    let firstTs = 0;

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      total++;
      if (d.vid) visitors.add(d.vid);
      if (!firstTs || d.ts < firstTs) firstTs = d.ts;

      // Trend bucket: hour-resolution (YYYY-MM-DDTHH) for sub-day windows, else day.
      const day = hourly
        ? new Date(d.ts).toISOString().slice(0, 13)
        : (d.day || new Date(d.ts).toISOString().slice(0, 10));
      let dd = byDay.get(day);
      if (!dd) { dd = { views: 0, visitors: new Set() }; byDay.set(day, dd); }
      dd.views++;
      if (d.vid) dd.visitors.add(d.vid);

      const path = d.path || '/';
      byPath.set(path, (byPath.get(path) || 0) + 1);

      // Everything below is "where from" and is human / non-owner / non-spam only.
      if (!countsAsTraffic(d, includeOwner)) return;

      const host = d.ref || '';
      const ch = classifyChannel(host, d.utm_medium, d.utm_source);

      // Channel totals
      let cm = byChannel.get(ch);
      if (!cm) { cm = { views: 0, visitors: new Set() }; byChannel.set(ch, cm); }
      cm.views++;
      if (d.vid) cm.visitors.add(d.vid);
      channelTotalViews++;

      // Channel-by-day VIEW counts. Views partition exactly (each doc lands in
      // one channel), so the stacked trend stays additive. Unique visitors would
      // overlap across channels and not sum.
      let cs = channelSeriesMap.get(day);
      if (!cs) { cs = new Map(); channelSeriesMap.set(day, cs); }
      cs.set(ch, (cs.get(ch) || 0) + 1);

      // Granular source
      const label = sourceLabel(host, d.utm_source);
      let sm = bySource.get(label);
      if (!sm) { sm = { views: 0, visitors: new Set(), chanTally: new Map() }; bySource.set(label, sm); }
      sm.views++;
      if (d.vid) sm.visitors.add(d.vid);
      sm.chanTally.set(ch, (sm.chanTally.get(ch) || 0) + 1);

      // Legacy referrer host leaderboard (external hosts only).
      if (host) byRef.set(host, (byRef.get(host) || 0) + 1);

      // Geography coverage + buckets
      geoTotalViews++;
      if (d.co) {
        geoKnownViews++;
        let gm = byCountry.get(d.co);
        if (!gm) { gm = { views: 0, visitors: new Set(), name: d.con || CC_NAME[d.co] || d.co }; byCountry.set(d.co, gm); }
        gm.views++;
        if (d.vid) gm.visitors.add(d.vid);
        if (d.reg) {
          const rk = `${d.co}|${d.reg}`;
          let rm = byRegion.get(rk);
          if (!rm) { rm = { co: d.co, reg: d.reg, name: '', views: 0, visitors: new Set() }; byRegion.set(rk, rm); }
          if (!rm.name && d.regn) rm.name = d.regn; // first stored subdivision name wins
          rm.views++;
          if (d.vid) rm.visitors.add(d.vid);
        }
        if (d.city) {
          const ck = `${d.co}|${d.city}`;
          let cym = byCity.get(ck);
          if (!cym) { cym = { co: d.co, city: d.city, country: d.con || CC_NAME[d.co] || d.co, reg: d.reg || '', regn: d.regn || '', views: 0, visitors: new Set() }; byCity.set(ck, cym); }
          if (!cym.reg && d.reg) cym.reg = d.reg;
          if (!cym.regn && d.regn) cym.regn = d.regn;
          cym.views++;
          if (d.vid) cym.visitors.add(d.vid);

          // Source -> city cross-tab: where did each source's visitors sit?
          let scm = bySourceCity.get(label);
          if (!scm) { scm = new Map(); bySourceCity.set(label, scm); }
          let scc = scm.get(ck);
          if (!scc) { scc = { co: d.co, city: d.city, country: d.con || CC_NAME[d.co] || d.co, reg: d.reg || '', regn: d.regn || '', views: 0, visitors: new Set() }; scm.set(ck, scc); }
          if (!scc.reg && d.reg) scc.reg = d.reg;
          if (!scc.regn && d.regn) scc.regn = d.regn;
          scc.views++;
          if (d.vid) scc.visitors.add(d.vid);
        }
      }

      // Campaign (first-touch: beacon tags only the session entry pageview).
      if (d.utm_campaign) {
        let pm = byCampaign.get(d.utm_campaign);
        if (!pm) { pm = { views: 0, visitors: new Set(), source: d.utm_source || '', medium: d.utm_medium || '' }; byCampaign.set(d.utm_campaign, pm); }
        pm.views++;
        if (d.vid) pm.visitors.add(d.vid);
      }
    });

    // Continuous bucket series so the chart has no gaps. Hourly windows step by
    // hour (YYYY-MM-DDTHH keys); day windows step by day (YYYY-MM-DD).
    const series = [];
    // +1 hourly bucket covers the partial leading hour (the window rarely starts
    // exactly on the hour), so the chart doesn't drop views the totals still count.
    const steps = hourly ? hours + 1 : days;
    const stepMs = hourly ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const sliceLen = hourly ? 13 : 10;
    for (let i = steps - 1; i >= 0; i--) {
      const key = new Date(Date.now() - i * stepMs).toISOString().slice(0, sliceLen);
      const dd = byDay.get(key);
      series.push({
        day: key,
        views: dd ? dd.views : 0,
        visitors: dd ? dd.visitors.size : 0,
      });
    }

    // Channels: always emit all six in fixed order so the legend never reflows.
    const chDenom = channelTotalViews || 1;
    const channels = CHANNELS.map((ch) => {
      const v = byChannel.get(ch) || { views: 0, visitors: new Set() };
      return {
        channel: ch,
        label: CHANNEL_LABELS[ch],
        views: v.views,
        visitors: v.visitors.size,
        pct: v.views / chDenom,
      };
    });

    // Per-day VIEW counts by channel (for the optional stacked view).
    const channelSeries = series.map((s) => {
      const cs = channelSeriesMap.get(s.day);
      const row = { day: s.day };
      for (const ch of CHANNELS) row[ch] = cs?.get(ch) || 0;
      return row;
    });

    // Sources: top 20 by unique visitors, plus an explicit Other remainder.
    // Channel chip = the source's modal channel.
    const sourcesAll = [...bySource.entries()]
      .map(([source, v]) => {
        // Modal channel for the chip; ties break by CHANNELS precedence, not
        // Firestore scan order, so the result is deterministic.
        let topCh = 'other', best = -1;
        for (const [c, n] of v.chanTally) {
          if (n > best || (n === best && CHANNELS.indexOf(c) < CHANNELS.indexOf(topCh))) {
            best = n; topCh = c;
          }
        }
        return { source, channel: topCh, views: v.views, visitors: v.visitors.size };
      })
      .sort((a, b) => b.visitors - a.visitors || (a.source < b.source ? -1 : 1));
    const topSources = sourcesAll.slice(0, 20);
    const sourcesOther = {
      views: sourcesAll.slice(20).reduce((s, x) => s + x.views, 0),
      count: Math.max(0, sourcesAll.length - 20),
    };

    // Countries: top 15 by unique visitors + Other remainder. Coverage tracked
    // separately so percentages are honest about unknown geography.
    const countriesAll = [...byCountry.entries()]
      .map(([code, v]) => ({
        code, name: v.name, flag: flagEmoji(code),
        views: v.views, visitors: v.visitors.size,
      }))
      .sort((a, b) => b.visitors - a.visitors || (a.code < b.code ? -1 : 1));
    const topCountries = countriesAll.slice(0, 15);
    const countriesOther = { views: countriesAll.slice(15).reduce((s, x) => s + x.views, 0) };
    const geo = {
      knownViews: geoKnownViews,
      unknownViews: geoTotalViews - geoKnownViews,
      coverage: geoTotalViews ? geoKnownViews / geoTotalViews : 0,
    };

    // Regions across all countries, ranked by unique visitors. Codes resolve to
    // names where available (stored subdivision name, then US-state fallback).
    // No top-country restriction and no visitor floor, so low-traffic regions
    // still surface. `code` is the country (for the flag); `region` the raw code.
    const regions = [...byRegion.values()]
      .map((r) => ({
        code: r.co, region: r.reg, name: regionLabel(r.co, r.reg, r.name),
        flag: flagEmoji(r.co), country: byCountry.get(r.co)?.name || CC_NAME[r.co] || r.co,
        views: r.views, visitors: r.visitors.size,
      }))
      .sort((a, b) => b.visitors - a.visitors || b.views - a.views || (a.name < b.name ? -1 : 1))
      .slice(0, 20);

    // Cities across all countries, ranked by unique visitors.
    const cities = [...byCity.values()]
      .map((c) => ({
        city: c.city, code: c.co, country: c.country, region: regionLabel(c.co, c.reg, c.regn), flag: flagEmoji(c.co),
        views: c.views, visitors: c.visitors.size,
      }))
      .sort((a, b) => b.visitors - a.visitors || b.views - a.views || (a.city < b.city ? -1 : 1))
      .slice(0, 15);

    // Source -> city cross-tab. Keyed by source label, each with its top 8
    // cities by unique visitors. Only sources with located views appear. Lets
    // the dashboard answer "which city did this source's traffic come from?".
    const sourceCities = {};
    for (const [label, scm] of bySourceCity) {
      sourceCities[label] = [...scm.values()]
        .map((c) => ({
          city: c.city, code: c.co, country: c.country,
          region: regionLabel(c.co, c.reg, c.regn), flag: flagEmoji(c.co),
          views: c.views, visitors: c.visitors.size,
        }))
        .sort((a, b) => b.visitors - a.visitors || b.views - a.views || (a.city < b.city ? -1 : 1))
        .slice(0, 8);
    }

    // Campaigns: top 15 by unique visitors.
    const topCampaigns = [...byCampaign.entries()]
      .map(([campaign, v]) => ({
        campaign, source: v.source, medium: v.medium,
        channel: classifyChannel('', v.medium, v.source),
        views: v.views, visitors: v.visitors.size,
      }))
      .sort((a, b) => b.visitors - a.visitors || (a.campaign < b.campaign ? -1 : 1))
      .slice(0, 15);

    const topPaths = [...byPath.entries()]
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 25);

    // Legacy field, kept for compatibility (external referrer hosts).
    const topReferrers = [...byRef.entries()]
      .map(([ref, views]) => ({ ref, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    return new Response(
      JSON.stringify({
        days,
        hours: hourly ? hours : null,
        bucket: hourly ? 'hour' : 'day',
        dataEpoch: DATA_EPOCH,
        firstTs,
        owner: includeOwner,
        totals: { views: total, visitors: visitors.size },

        channels,
        channelTotalViews,
        channelSeries,

        topSources,
        sourcesOther,

        topCountries,
        countriesOther,
        geo,
        regions,
        cities,
        sourceCities,

        topCampaigns,
        hasCampaigns: topCampaigns.length > 0,

        series,
        topPaths,
        topReferrers,
      }),
      { status: 200, headers: { ...corsHeaders, ...secureHeaders(), 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, 'GET, OPTIONS');
}
