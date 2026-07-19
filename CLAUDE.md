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
- `src/pages/analytics/` - Password-gated analytics dashboard
- `src/pages/mimir/` - AI chat interface
- `src/pages/api/track.js` - Pageview beacon (SSR)
- `src/pages/api/analytics.js` - Analytics data aggregation (SSR, auth-gated)
- `src/pages/api/auth.js` - Authentication (SSR)
- `src/pages/api/subscribe.js` - Email subscription (SSR)
- `src/pages/api/subscribers.js` - Subscriber CRUD (SSR, auth-gated)
- `src/pages/api/mimir.js` - Chat send/poll (SSR)

### Layouts

- `BaseLayout.astro` - Site-wide wrapper
- `PostLayout.astro` - Blog post wrapper

### Styling

Uses `@fontsource/inter` and `@fontsource-variable/jetbrains-mono`. Styles in `src/styles/`.

### Key Dependencies

- `chart.js` and `d3` for data visualization in posts/library items

### Characters

Character JSON files for the multi-agent panel (`agent_panel.py`). Each set is a directory:
- `characters/cyber/` - Cyberpunk Night City theme
- `characters/diesel/` - Dieselpunk bunker theme
- `characters/modelthinker/` - Mental model problem-solvers
- `characters/analysts/` - Analyst characters
- `characters/mathlab/` - Math/stats themed characters
