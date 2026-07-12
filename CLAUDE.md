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
- `src/pages/mimir/` - Messaging system
- `src/pages/analytics/` - Password-gated analytics dashboard
- `src/pages/privacy.astro` - Privacy policy
- `src/pages/terms.astro` - Terms and conditions

### API Endpoints (SSR via Netlify adapter)

- `src/pages/api/auth.js` - Password authentication, returns JWT
- `src/pages/api/track.js` - Pageview analytics beacon
- `src/pages/api/analytics.js` - Aggregated analytics data (auth required)
- `src/pages/api/mimir.js` - Messaging send/poll
- `src/pages/api/subscribe.js` - Email newsletter subscription
- `src/pages/api/subscribers.js` - Subscriber management (auth required)

### Layouts

- `BaseLayout.astro` - Site-wide wrapper
- `PostLayout.astro` - Blog post wrapper

### Styling

Uses `@fontsource/inter` and `@fontsource-variable/jetbrains-mono`. Styles in `src/styles/`.

### Key Dependencies

- `chart.js` and `d3` for data visualization in posts/library items

### Agents System

Multi-agent character data lives in `characters/`. Each set is a directory with character JSON, relationships, and room definitions. Used by `agent_panel.py` (standalone Python script) and headshot/room generation scripts.

**Character sets:**
- `characters/analysts/` - Data analysts theme (8 characters)
- `characters/cyber/` - Cyberpunk Night City theme (5 characters)
- `characters/diesel/` - Dieselpunk bunker theme (6 characters)
- `characters/mathlab/` - Math/statistics theme (12 characters)
- `characters/modelthinker/` - Mental model problem-solvers (12 characters)

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

**Relationships JSON:** `relationships_<theme>.json` -- array of pairings with `between`, `type`, `history`, `current_tension`, `shared_knowledge`. Every character pair should have an entry.

**Room JSON:** `room_<name>.json` -- `name`, `location`, `time`, `weather`, `atmosphere` (lighting/sound/crowd/smell), `layout` (named areas), `objects_of_note`, `mood`.
