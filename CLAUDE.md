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
- `src/pages/mimir/` - Visitor messaging (Mimir AI assistant)
- `src/pages/analytics/` - Password-gated analytics dashboard
- `src/pages/privacy.astro` - Privacy policy
- `src/pages/terms.astro` - Terms page

### API Endpoints (SSR via Netlify adapter)

- `src/pages/api/auth.js` - Password auth with HMAC-signed session tokens
- `src/pages/api/track.js` - First-party pageview tracking beacon
- `src/pages/api/analytics.js` - Authenticated analytics data
- `src/pages/api/mimir.js` - Mimir messaging (send/poll via Firestore)
- `src/pages/api/subscribe.js` - Email subscription
- `src/pages/api/subscribers.js` - Subscriber management (auth-gated)

### Layouts

- `BaseLayout.astro` - Site-wide wrapper
- `PostLayout.astro` - Blog post wrapper

### Styling

Uses `@fontsource/inter` and `@fontsource-variable/jetbrains-mono`. Styles in `src/styles/`.

### Key Dependencies

- `chart.js` for data visualization in posts/library items
- `d3` vendored in `public/embeds/` for interactive visualizations
- `firebase-admin` for Firestore (analytics, Mimir, subscribers)
- `katex` / `rehype-katex` / `remark-math` for math rendering

### Agents System (character data only, no live pages)

Character JSON files live in `characters/`. Each set is a directory:
- `characters/cyber/` - Cyberpunk Night City theme
- `characters/diesel/` - Dieselpunk bunker theme
- `characters/modelthinker/` - Mental model problem-solvers
- `characters/analysts/` - Analyst team
- `characters/mathlab/` - Math/statistics agents

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

**Order modes** (dropdown in UI):
- Default: fixed upload order
- Random: Fisher-Yates shuffle per round
- Priority: agents bid 1-10 urgency before each round, sorted by bid

**Model Thinker characters** (12 total): Axiom (First Principles), Loop (Systems Thinking), Prior (Bayesian), Nash (Game Theory), Contra (Inversion), Bottleneck (Theory of Constraints), Darwin (Evolutionary), Tail (Power Laws/Fat Tails), Web (Network Theory), Margin (Marginal Thinking), Razor (Occam's Razor), Atlas (Map vs Territory). Each applies their mental model as a lens to problems. Tension comes from where models disagree.

### Mimir Messaging System

Visitor messaging at `src/pages/mimir/index.astro` plus a floating chat widget embedded in `BaseLayout.astro`. Uses Firestore `dm_conversations` collection. Visitor identity via `crypto.randomUUID()` stored in localStorage.
