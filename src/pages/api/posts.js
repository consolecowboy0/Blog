export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { listPosts, savePost } from '../../lib/github-posts.js';

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

  try {
    const posts = await listPosts();
    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
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

  let fm = `---\ntitle: "${title}"\ndate: "${date}"`;
  if (description) fm += `\ndescription: "${description}"`;
  if (draft) fm += `\ndraft: true`;
  fm += `\n---\n\n${content || ''}`;

  try {
    await savePost(filename, fm, null, `Add post: ${title}`);
    return new Response(JSON.stringify({ ok: true, id: safe, file: filename }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
