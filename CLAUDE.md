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
- `src/pages/racing.astro` - Motorsport placeholder
- `src/pages/analytics/` - Password-gated analytics dashboard
- `src/pages/404.astro` - Custom 404 page

### Layouts

- `BaseLayout.astro` - Site-wide wrapper
- `PostLayout.astro` - Blog post wrapper

### Styling

Uses `@fontsource/inter` and `@fontsource-variable/jetbrains-mono`. Styles in `src/styles/`.

### Key Dependencies

- `chart.js` and `d3` for data visualization in posts/library items

### API Endpoints (SSR via Netlify adapter)

- `src/pages/api/track.js` - Pageview beacon ingest (Firebase)
- `src/pages/api/auth.js` - Password authentication, token generation
- `src/pages/api/analytics.js` - Aggregated pageview stats (auth-gated)
- `src/pages/api/subscribe.js` - Email subscription
- `src/pages/api/subscribers.js` - Subscriber CRUD (auth-gated)
- `src/pages/api/whitelightning-scores.js` - Game leaderboard

### Characters

Character JSON files live in `characters/`. Each set is a directory with character files, relationships, and rooms:
- `characters/analysts/` - Analyst characters
- `characters/cyber/` - Cyberpunk Night City theme
- `characters/diesel/` - Dieselpunk bunker theme
- `characters/mathlab/` - Math/ML characters
- `characters/modelthinker/` - Mental model problem-solvers
