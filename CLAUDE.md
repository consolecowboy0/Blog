# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build locally

## Architecture

Astro 6 blog deployed to Netlify (with Netlify adapter for SSR). Uses MDX for content.

### Content Collections

Defined in `src/content.config.ts`. Two collections:

- **posts** (`src/content/posts/`): Blog posts with `title`, `date`, optional `description`, optional `draft`
- **library** (`src/content/library/`): Library items with `title`, `type` (markdown|pdf|interactive|html|react), `date`, optional `file`, optional `description`, optional `draft`

### Pages

- `src/pages/index.astro` — Homepage
- `src/pages/posts/[...id].astro` — Dynamic post routes
- `src/pages/library/` — Library section
- `src/pages/rockoutwithyour/` — Interactive feature page
- `src/pages/api/agent-chat.js` — Server-side API endpoint (SSR via Netlify adapter)
- `src/pages/dev/` — Dev-only pages

### Layouts

- `BaseLayout.astro` — Site-wide wrapper
- `PostLayout.astro` — Blog post wrapper

### Styling

Uses `@fontsource/inter` and `@fontsource-variable/jetbrains-mono`. Styles in `src/styles/`.

### Key Dependencies

- `chart.js` and `d3` for data visualization in posts/library items
