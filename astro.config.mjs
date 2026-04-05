import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';

export default defineConfig({
  integrations: [mdx()],
  site: 'https://example.com',
  adapter: netlify(),
});
