// First-party pageview beacon. Fire-and-forget, no cookies.
//
// One shared script for the WHOLE site (dustinlanders.com), not just the blog.
// Include it from any page, Astro or static HTML:
//   <script src="/beacon.js"></script>
// It posts to /api/track. The endpoint stores path/referrer/geo/UTM and does
// its own bot + private-path filtering, so pages only need this one line.
(function () {
  try {
    var p = location.pathname;
    // Never self-report the private dashboard (server also skips it).
    if (/^\/(analytics)(\/|$)/.test(p)) return;

    // UTM: only on the first pageview of a session, so refreshes and deep
    // navigation don't re-credit a campaign for the whole visit.
    var utm = null;
    try {
      if (!sessionStorage.getItem('utm_seen')) {
        var q = new URLSearchParams(location.search);
        var keys = ['utm_source', 'utm_medium', 'utm_campaign'];
        var o = {};
        for (var i = 0; i < keys.length; i++) {
          var v = q.get(keys[i]);
          if (v) o[keys[i].slice(4)] = String(v).slice(0, 120);
        }
        if (Object.keys(o).length) utm = o;
        sessionStorage.setItem('utm_seen', '1');
      }
    } catch (e) {}

    // Owner self-flag: set via the /analytics "This is me" button, which
    // writes localStorage.analytics_owner='1'. Lets the dashboard exclude
    // the owner's own visits from the where-from breakdowns.
    var own = false;
    try { own = localStorage.getItem('analytics_owner') === '1'; } catch (e) {}

    var body = { path: p, ref: document.referrer || '' };
    if (utm) body.utm = utm;
    if (own) body.own = 1;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(body),
    }).catch(function () {});
  } catch (e) {}
})();
