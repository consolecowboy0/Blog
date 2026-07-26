import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/api/') &&
        !page.includes('/analytics/') &&
        !page.includes('/whitelightning/') &&
        !page.includes('/desertrally/'),
    }),
  ],
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
    // Hover/tap intent, not viewport. Viewport prefetch occasionally served a
    // cached response as a download instead of navigating; a refresh always
    // fixed it. Hover prefetches far less and stays fresh at click time.
    defaultStrategy: 'hover',
  },
  vite: {
    ssr: {
      external: ['firebase-admin', 'firebase-admin/app', 'firebase-admin/firestore'],
    },
  },
});
