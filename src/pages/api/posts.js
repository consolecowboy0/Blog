export const prerender = false;

import { requireAuth } from '../../lib/auth.js';
import { listPosts, savePost } from '../../lib/github-posts.js';
import { corsHeadersFor, preflight } from '../../lib/cors.js';

export async function GET({ request }) {
  const corsHeaders = corsHeadersFor(request, 'GET, POST, OPTIONS');
  const auth = requireAuth(request, 'backend');
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
  const corsHeaders = corsHeadersFor(request, 'GET, POST, OPTIONS');
  const auth = requireAuth(request, 'backend');
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

  if (typeof title !== 'string' || typeof date !== 'string') {
    return new Response(JSON.stringify({ error: 'title and date must be strings' }), {
      status: 400,
      headers: corsHeaders,
    });
  }
  if (title.length > 300 || date.length > 40) {
    return new Response(JSON.stringify({ error: 'title or date too long' }), {
      status: 400,
      headers: corsHeaders,
    });
  }
  if (description && (typeof description !== 'string' || description.length > 1000)) {
    return new Response(JSON.stringify({ error: 'invalid description' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const safe = slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const filename = `${safe}.md`;

  // JSON strings are valid YAML double-quoted scalars, so JSON.stringify
  // safely escapes quotes, newlines, and control chars in frontmatter values.
  let fm = `---\ntitle: ${JSON.stringify(title)}\ndate: ${JSON.stringify(date)}`;
  if (description) fm += `\ndescription: ${JSON.stringify(description)}`;
  if (draft) fm += `\ndraft: true`;
  fm += `\n---\n\n${typeof content === 'string' ? content : ''}`;

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

export async function OPTIONS({ request }) {
  return preflight(request, 'GET, POST, OPTIONS');
}
