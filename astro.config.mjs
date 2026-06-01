import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';

export default defineConfig({
  integrations: [mdx()],
  site: process.env.SITE_URL || 'https://dustinlanders.com',
  adapter: netlify(),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  vite: {
    ssr: {
      // Agent SDK requires Claude Code CLI — exclude from Netlify bundle
      external: ['@anthropic-ai/claude-agent-sdk', 'firebase-admin', 'firebase-admin/app', 'firebase-admin/firestore'],
    },
  },
});
