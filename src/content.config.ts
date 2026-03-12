import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const library = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/library' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['markdown', 'pdf', 'interactive']),
    description: z.string().optional(),
    date: z.string(),
    file: z.string().optional(),
  }),
});

export const collections = { posts, library };
