import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';

export default defineConfig({
  integrations: [mdx()],
  site: process.env.SITE_URL || 'https://dustinlanders.com',
  adapter: netlify(),
  prefetch: {
    prefetchAll: true,
    // Hover/tap intent, not viewport. Viewport prefetch occasionally served a
    // cached response as a download instead of navigating; a refresh always
    // fixed it. Hover prefetches far less and stays fresh at click time.
    defaultStrategy: 'hover',
  },
  vite: {
    ssr: {
      // Agent SDK requires Claude Code CLI — exclude from Netlify bundle
      external: ['@anthropic-ai/claude-agent-sdk', 'firebase-admin', 'firebase-admin/app', 'firebase-admin/firestore'],
    },
  },
});
