import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  integrations: [mdx()],
  // Math rendering. singleDollarTextMath:false so a bare $ stays a dollar sign
  // (posts are full of "$455", "$682M"); only $$...$$ is treated as math.
  markdown: {
    remarkPlugins: [[remarkMath, { singleDollarTextMath: false }]],
    rehypePlugins: [rehypeKatex],
  },
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
