# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Style (highest priority)

- Never use em dashes.
- Be terse. Short sentences. No filler, no preamble.
- Run tools first, show result, then stop. Do not narrate.

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build locally

## Architecture

Astro 6 blog deployed to Netlify (with Netlify adapter for SSR). Uses MDX for content.

### Content Collections

Defined in `src/content.config.ts`. Two collections:

- **posts** (`src/content/posts/`): Blog posts with `title`, `date`, optional `description`, optional `draft`
- **library** (`src/content/library/`): Library items with `title`, `type` (markdown|pdf|interactive|html|react), `date`, optional `file`, optional `description`, optional `draft`

### Pages

- `src/pages/index.astro` - Homepage
- `src/pages/posts/[...id].astro` - Dynamic post routes
- `src/pages/library/` - Library section
- `src/pages/mimir/` - Mimir direct-message chat interface
- `src/pages/analytics/` - Password-gated analytics dashboard
- `src/pages/privacy.astro` - Privacy policy
- `src/pages/terms.astro` - Terms and conditions

### API Endpoints (SSR)

- `src/pages/api/track.js` - Pageview beacon (Firestore)
- `src/pages/api/analytics.js` - Analytics dashboard data (auth required)
- `src/pages/api/auth.js` - Authentication (SHA-256 password verify, HMAC token)
- `src/pages/api/mimir.js` - Mimir messaging (send/poll, Firestore)
- `src/pages/api/subscribe.js` - Email subscription
- `src/pages/api/subscribers.js` - Subscriber CRUD (auth required)

### Layouts

- `BaseLayout.astro` - Site-wide wrapper (includes persistent Mimir chat widget)
- `PostLayout.astro` - Blog post wrapper

### Styling

Uses `@fontsource/inter` and `@fontsource-variable/jetbrains-mono`. Styles in `src/styles/`.

Nine Norse realm themes: rainbow (Asgard, default), vanaheim, muspelheim, niflheim, alfheim, midgard, jotunheim, svartalfheim, helheim. Theme toggle cycles through all nine.

### Key Dependencies

- `chart.js` and `d3` for data visualization in posts/library items
- `firebase-admin` for Firestore (pageviews, DMs, subscribers)
- `katex` for math rendering via remark-math/rehype-katex

### Lib Modules

- `src/lib/auth.js` - HMAC-SHA256 token signing/verification, password hashing
- `src/lib/channels.js` - Acquisition channel classification for analytics
- `src/lib/cors.js` - CORS whitelist
- `src/lib/firebase.js` - Firebase Admin SDK singleton
- `src/lib/rate-limit.js` - In-memory sliding-window rate limiter

### Characters (Agent Panel Data)

Character sets live in `characters/`. Each set is a directory with character JSONs, a room JSON, and a relationships JSON. Sets: `analysts/`, `cyber/`, `diesel/`, `mathlab/`, `modelthinker/`.
