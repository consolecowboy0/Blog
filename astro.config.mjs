import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';

export default defineConfig({
  integrations: [mdx()],
  site: 'https://example.com',
  adapter: netlify(),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  vite: {
    ssr: {
      // Agent SDK requires Claude Code CLI — exclude from Netlify bundle
      external: ['@anthropic-ai/claude-agent-sdk'],
    },
  },
});
