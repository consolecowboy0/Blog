// Acquisition-channel classification + referrer hygiene. Read-time only.
// Channels: search | social | email | referral | direct | other.
// "direct" is really "direct / unknown" (empty referrer): app opens, typed
// URLs, privacy browsers, stripped referrers. UTM rescues tagged dark social.
//
// Classification runs at READ time (in analytics.js), not at ingest, so one
// deploy reclassifies all history and the stored docs stay small.

export const CHANNELS = ['search', 'social', 'email', 'referral', 'direct', 'other'];

export const CHANNEL_LABELS = {
  search: 'Organic Search',
  social: 'Social',
  email: 'Email',
  referral: 'Referral',
  direct: 'Direct / unknown',
  other: 'Other',
};

// Host keyword sets. Substring match on lowercased host. Documented and editable.
const SEARCH = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'yandex.',
  'baidu.', 'ecosia.', 'search.brave.com', 'startpage.', 'kagi.'];
const SOCIAL = ['t.co', 'x.com', 'twitter.com', 'facebook.', 'fb.com', 'fb.me',
  'lnkd.in', 'linkedin.', 'reddit.', 'news.ycombinator.com', 'bsky.app',
  'mastodon.', 'mas.to', 'fosstodon.', 'hachyderm.io', 'instagram.',
  'youtube.', 'youtu.be', 't.me', 'threads.net', 'substack.com'];
const EMAIL = ['mail.google.com', 'outlook.', 'mail.yahoo.', 'mail.proton',
  'campaign-archive.com', 'list-manage.com'];

// Known referrer-spam hosts. Excluded from leaderboards and never paint a channel.
const SPAM = ['buttons-for-website.com', 'semalt.com', 'best-seo-',
  'darodar.com', 'free-share-buttons', '4webmasters.org', 'rankings-'];

function hostMatches(host, list) {
  for (const k of list) if (host.indexOf(k) !== -1) return true;
  return false;
}

// Plausible hostname: has a dot, no spaces, not a bare IP.
const HOST_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
export function isPlausibleHost(host) {
  if (!host) return false;
  if (IP_RE.test(host)) return false;
  return HOST_RE.test(host);
}
export function isSpamHost(host) {
  return !!host && hostMatches(host.toLowerCase(), SPAM);
}

// Map utm_medium -> channel. Paid (cpc/ppc/display/affiliate) falls to 'referral',
// never 'search', so organic search stays clean.
function mediumToChannel(med) {
  if (!med) return '';
  med = med.toLowerCase();
  if (/email|newsletter/.test(med)) return 'email';
  if (/social|^sm$|sm$|paid-social/.test(med)) return 'social';
  if (/^(organic|search)$/.test(med)) return 'search';
  if (/cpc|ppc|paid|display|banner|affiliate|referral/.test(med)) return 'referral';
  return '';
}

// Precedence: utm_medium > utm_source > referrer host > direct.
// host = cleaned referrer hostname ('' for direct). med/src = utm fields ('').
export function classifyChannel(host, med, src) {
  host = (host || '').toLowerCase();
  med = (med || '').toLowerCase();
  src = (src || '').toLowerCase();

  // Spam never paints a channel.
  if (host && isSpamHost(host)) return 'other';

  // 1. utm_medium wins (rescues dark social / tagged email even when ref empty).
  const m = mediumToChannel(med);
  if (m) return m;

  // 2. utm_source hints when medium absent.
  if (src) {
    if (/newsletter|mailchimp|substack|sendgrid|convertkit|beehiiv/.test(src)) return 'email';
    if (hostMatches(src, SOCIAL)) return 'social';
    if (hostMatches(src, SEARCH)) return 'search';
  }

  // 3. Referrer host classification. EMAIL before SEARCH so webmail hosts like
  // mail.google.com / mail.yahoo.com aren't swallowed by the broad search keys.
  if (host) {
    if (hostMatches(host, EMAIL)) return 'email';
    if (hostMatches(host, SEARCH)) return 'search';
    if (hostMatches(host, SOCIAL)) return 'social';
    return 'referral';
  }

  // 4. No referrer, no UTM -> direct / unknown.
  return 'direct';
}

// Canonical granular source label for the Sources leaderboard.
// Precedence: utm_source -> referrer host -> '(direct)'.
export function sourceLabel(host, src) {
  if (src) return src.toLowerCase().slice(0, 120);
  if (host) return host;
  return '(direct)';
}

// Flag emoji from ISO alpha-2 (regional indicators). '' / bad code -> globe.
export function flagEmoji(cc) {
  if (!cc || cc.length !== 2 || !/^[A-Z]{2}$/.test(cc)) return '\u{1F310}';
  const A = 0x1F1E6;
  return String.fromCodePoint(A + (cc.charCodeAt(0) - 65), A + (cc.charCodeAt(1) - 65));
}

// Minimal alpha-2 -> name fallback when only a bare country code is available
// (x-nf-geo already supplies the full name in `con`). Extend as needed.
export const CC_NAME = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
  DE: 'Germany', FR: 'France', NL: 'Netherlands', IN: 'India', BR: 'Brazil',
  JP: 'Japan', SE: 'Sweden', ES: 'Spain', IT: 'Italy', IE: 'Ireland',
  PL: 'Poland', RU: 'Russia', CN: 'China', MX: 'Mexico', NO: 'Norway',
  FI: 'Finland', DK: 'Denmark', CH: 'Switzerland', AT: 'Austria', BE: 'Belgium',
  NZ: 'New Zealand', SG: 'Singapore', KR: 'South Korea', ZA: 'South Africa',
  PT: 'Portugal', UA: 'Ukraine', TR: 'Turkey', AR: 'Argentina', CL: 'Chile',
};
