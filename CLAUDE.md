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
- `src/pages/analytics/` - Traffic analytics dashboard (password-gated)
- `src/pages/mimir/` - AI messaging interface
- `src/pages/story/` - Story Studio (multi-agent collaborative fiction)
- `src/pages/api/` - Server-side API endpoints (SSR via Netlify adapter)

### API Endpoints

- `src/pages/api/analytics.js` - Dashboard traffic stats (auth required)
- `src/pages/api/track.js` - First-party pageview beacon
- `src/pages/api/subscribe.js` - Email subscription
- `src/pages/api/subscribers.js` - Subscriber management (auth required)
- `src/pages/api/mimir.js` - Mimir chat backend
- `src/pages/api/auth.js` - Session token generation

### Layouts

- `BaseLayout.astro` - Site-wide wrapper (theme system, analytics beacon)
- `PostLayout.astro` - Blog post wrapper (drop-cap, magazine typography)

### Styling

Uses `@fontsource/inter` and `@fontsource-variable/jetbrains-mono`. Styles in `src/styles/`. Nine themes (Norse mythology-inspired) toggled via `data-theme` attribute on `<html>`.

### Key Dependencies

- `chart.js` and `d3` for data visualization in posts/library items
- `firebase-admin` for Firestore (pageviews, subscribers, conversations)
- `@anthropic-ai/claude-agent-sdk` for Story Studio AI

### Lib Modules

- `src/lib/auth.js` - HMAC token creation/verification, password checking
- `src/lib/firebase.js` - Firebase Admin singleton
- `src/lib/cors.js` - CORS headers for API routes
- `src/lib/channels.js` - Traffic source classification (search/social/email/referral/direct)
- `src/lib/rate-limit.js` - In-memory sliding-window rate limiter

### Characters System

Character data lives in `characters/`. Used by Story Studio and the separate API server.

**Character sets** (each a directory):
- `characters/cyber/` - Cyberpunk Night City theme
- `characters/diesel/` - Dieselpunk bunker theme
- `characters/modelthinker/` - Mental model problem-solvers (12 characters)
- `characters/analysts/` - Analysis-focused characters
- `characters/mathlab/` - Mathematical characters

**Character JSON format:**
```json
{
  "name": "Name",
  "age": 41,
  "occupation": "...",
  "appearance": "...",
  "personality": { "core_traits": [], "flaws": [], "strengths": [] },
  "model": "Model Name (modelthinker only)",
  "model_description": "What the model does (modelthinker only)",
  "speaking_style": { "tone": "", "habits": [], "vocabulary": "", "quirks": [] },
  "backstory": "...",
  "current_emotional_state": "...",
  "secrets": "...",
  "motivations": "...",
  "physical_mannerisms": []
}
```

**Relationships JSON:** `relationships_<theme>.json` - array of pairings with `between`, `type`, `history`, `current_tension`, `shared_knowledge`.

**Room JSON:** `room_<name>.json` - `name`, `location`, `time`, `weather`, `atmosphere` (lighting/sound/crowd/smell), `layout` (named areas), `objects_of_note`, `mood`.

### Separate Server

`server/` is a standalone Express server for the Story Studio chat endpoint (`/api/story-chat`). Deployed independently (Caddy reverse proxy). The Astro site calls it from the Story Studio page.
