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
- `src/pages/mimir/` - Mimir messaging interface
- `src/pages/analytics/` - Password-gated analytics dashboard
- `src/pages/privacy.astro` - Privacy policy
- `src/pages/terms.astro` - Terms and conditions
- `src/pages/api/track.js` - Pageview beacon (Firestore)
- `src/pages/api/analytics.js` - Analytics data API (auth-gated)
- `src/pages/api/auth.js` - Password auth, issues JWT tokens
- `src/pages/api/mimir.js` - Mimir messaging endpoint
- `src/pages/api/subscribe.js` - Email subscription
- `src/pages/api/subscribers.js` - Subscriber CRUD (auth-gated)

### Layouts

- `BaseLayout.astro` - Site-wide wrapper
- `PostLayout.astro` - Blog post wrapper

### Styling

Uses `@fontsource/inter` and `@fontsource-variable/jetbrains-mono`. Styles in `src/styles/`.

### Key Dependencies

- `chart.js` and `d3` for data visualization in posts/library items

### Characters (offline)

Character JSON files for the multi-agent panel live in `characters/`. The agents UI page has been removed from the site, but the character data remains for the standalone `agent_panel.py` script.

Character sets: `cyber/`, `diesel/`, `modelthinker/`, `analysts/`, `mathlab/`.
