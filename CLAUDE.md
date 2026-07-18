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
- `src/pages/mimir/` - Chat inbox (visitor DMs via Firebase)
- `src/pages/analytics/` - Password-gated analytics dashboard
- `src/pages/api/track.js` - Pageview beacon (Firestore)
- `src/pages/api/analytics.js` - Auth-gated analytics data
- `src/pages/api/auth.js` - HMAC-based password auth
- `src/pages/api/mimir.js` - DM send/poll (Firestore)
- `src/pages/api/subscribe.js` - Email subscription
- `src/pages/api/subscribers.js` - Auth-gated subscriber CRUD

### Layouts

- `BaseLayout.astro` - Site-wide wrapper
- `PostLayout.astro` - Blog post wrapper

### Styling

Uses `@fontsource/inter` and `@fontsource-variable/jetbrains-mono`. Styles in `src/styles/`.

### Key Dependencies

- `chart.js` and `d3` for data visualization in posts/library items

### Characters (data only, no live UI)

Character JSON files in `characters/` are used by `agent_panel.py` (standalone Python script). The web-based agents UI was decommissioned. Five character sets: `analysts/`, `cyber/`, `diesel/`, `mathlab/`, `modelthinker/`. Each set has character files, a relationships JSON, and room JSON files.
