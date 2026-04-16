export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { listPosts, savePost } from '../../lib/github-posts.js';
import { getCorsHeaders } from '../../lib/cors.js';

export async function GET({ request }) {
  const cors = getCorsHeaders(request, 'GET, POST, OPTIONS');
  const auth = requireAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: cors,
    });
  }

  try {
    const posts = await listPosts();
    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[posts] list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function POST({ request }) {
  const cors = getCorsHeaders(request, 'GET, POST, OPTIONS');
  const auth = requireAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: cors,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: cors,
    });
  }

  const { slug, title, date, description, draft, content } = body;
  if (!slug || !title || !date) {
    return new Response(JSON.stringify({ error: 'Missing slug, title, or date' }), {
      status: 400,
      headers: cors,
    });
  }

  const safe = slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const filename = `${safe}.md`;

  let fm = `---\ntitle: "${title}"\ndate: "${date}"`;
  if (description) fm += `\ndescription: "${description}"`;
  if (draft) fm += `\ndraft: true`;
  fm += `\n---\n\n${content || ''}`;

  try {
    await savePost(filename, fm, null, `Add post: ${title}`);
    return new Response(JSON.stringify({ ok: true, id: safe, file: filename }), {
      status: 201,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[posts] save error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS({ request }) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request, 'GET, POST, OPTIONS') });
}
