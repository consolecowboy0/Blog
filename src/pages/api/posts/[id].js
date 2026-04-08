export const prerender = false;

import { requireAuth } from '../../../lib/auth.js';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const POSTS_DIR = new URL('../../../content/posts/', import.meta.url).pathname;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function parseFrontmatter(raw) {
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
  const content = match ? raw.slice(match[0].length).replace(/^\n+/, '') : raw;
  return { frontmatter, content };
}

async function findPostFile(id) {
  for (const ext of ['.md', '.mdx']) {
    const filepath = join(POSTS_DIR, id + ext);
    try {
      const raw = await readFile(filepath, 'utf-8');
      return { filepath, filename: id + ext, raw };
    } catch {
      // try next extension
    }
  }
  return null;
}

export async function GET({ params, request }) {
  const auth = requireAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const found = await findPostFile(params.id);
  if (!found) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { frontmatter, content } = parseFrontmatter(found.raw);

  return new Response(JSON.stringify({
    id: params.id,
    file: found.filename,
    title: frontmatter.title || '',
    date: frontmatter.date || '',
    description: frontmatter.description || '',
    draft: frontmatter.draft || false,
    content,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function PUT({ params, request }) {
  const auth = requireAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const found = await findPostFile(params.id);
  if (!found) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

  const { title, date, description, draft, content } = body;

  let fm = `---\ntitle: "${title}"\ndate: "${date}"`;
  if (description) fm += `\ndescription: "${description}"`;
  if (draft) fm += `\ndraft: true`;
  fm += `\n---\n\n${content || ''}`;

  await writeFile(found.filepath, fm, 'utf-8');

  return new Response(JSON.stringify({ ok: true, file: found.filename }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function DELETE({ params, request }) {
  const auth = requireAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const found = await findPostFile(params.id);
  if (!found) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await unlink(found.filepath);

  return new Response(JSON.stringify({ ok: true, deleted: found.filename }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
