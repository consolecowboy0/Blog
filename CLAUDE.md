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
- `src/pages/mimir/` - Chat interface with Firebase-backed messaging
- `src/pages/analytics/` - Password-gated analytics dashboard
- `src/pages/api/track.js` - Pageview beacon (POST)
- `src/pages/api/subscribe.js` - Email subscription (POST)
- `src/pages/api/auth.js` - Auth token issuance (POST)
- `src/pages/api/analytics.js` - Analytics data (GET, auth required)
- `src/pages/api/mimir.js` - Mimir chat actions (POST)
- `src/pages/api/subscribers.js` - Subscriber CRUD (auth required)

### Layouts

- `BaseLayout.astro` - Site-wide wrapper
- `PostLayout.astro` - Blog post wrapper

### Styling

Uses `@fontsource/inter` and `@fontsource-variable/jetbrains-mono`. Styles in `src/styles/`.

### Key Dependencies

- `chart.js` for data visualization in posts/library items
- `firebase-admin` for Firestore (analytics, subscribers, Mimir chat)
- `katex` / `remark-math` / `rehype-katex` for LaTeX math rendering

### Characters

Character sets live in `characters/` for use by `agent_panel.py` (standalone Python multi-agent chat script). Five sets: `analysts/`, `cyber/`, `diesel/`, `mathlab/`, `modelthinker/`. Each contains character JSONs, a `relationships_*.json`, and one or more `room_*.json` files.
