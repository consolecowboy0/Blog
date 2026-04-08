export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const POSTS_DIR = new URL('../../content/posts/', import.meta.url).pathname;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET({ request }) {
  const auth = requireAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const files = await readdir(POSTS_DIR);
  const posts = [];

  for (const file of files) {
    if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
    const raw = await readFile(join(POSTS_DIR, file), 'utf-8');
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = {};
    if (match) {
      for (const line of match[1].split('\n')) {
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val === 'true') val = true;
        if (val === 'false') val = false;
        frontmatter[key] = val;
      }
    }
    posts.push({ id: file.replace(/\.(md|mdx)$/, ''), file, ...frontmatter });
  }

  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return new Response(JSON.stringify({ posts }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function POST({ request }) {
  const auth = requireAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { slug, title, date, description, draft, content } = body;
  if (!slug || !title || !date) {
    return new Response(JSON.stringify({ error: 'Missing slug, title, or date' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const safe = slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const filename = `${safe}.md`;
  const filepath = join(POSTS_DIR, filename);

  let fm = `---\ntitle: "${title}"\ndate: "${date}"`;
  if (description) fm += `\ndescription: "${description}"`;
  if (draft) fm += `\ndraft: true`;
  fm += `\n---\n\n${content || ''}`;

  await writeFile(filepath, fm, 'utf-8');

  return new Response(JSON.stringify({ ok: true, id: safe, file: filename }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
