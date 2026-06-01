export const prerender = false;

import { requireAuth } from '../../../lib/auth.js';
import { getPost, savePost, deletePost } from '../../../lib/github-posts.js';
import { corsHeadersFor, preflight } from '../../../lib/cors.js';

const METHODS = 'GET, PUT, DELETE, OPTIONS';

function unauthorized(corsHeaders) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: corsHeaders,
  });
}

export async function GET({ params, request }) {
  const corsHeaders = corsHeadersFor(request, METHODS);
  if (!requireAuth(request, 'backend')) return unauthorized(corsHeaders);

  try {
    const post = await getPost(params.id);
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'GitHub API error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT({ params, request }) {
  const corsHeaders = corsHeadersFor(request, METHODS);
  if (!requireAuth(request, 'backend')) return unauthorized(corsHeaders);

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const found = await getPost(params.id);
    if (!found) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { title, date, description, draft, content } = body;
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

    // JSON strings are valid YAML double-quoted scalars.
    let fm = `---\ntitle: ${JSON.stringify(title)}\ndate: ${JSON.stringify(date)}`;
    if (description) fm += `\ndescription: ${JSON.stringify(description)}`;
    if (draft) fm += `\ndraft: true`;
    fm += `\n---\n\n${typeof content === 'string' ? content : ''}`;

    await savePost(found.file, fm, found.sha, `Update post: ${title}`);

    return new Response(JSON.stringify({ ok: true, file: found.file }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'GitHub API error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE({ params, request }) {
  const corsHeaders = corsHeadersFor(request, METHODS);
  if (!requireAuth(request, 'backend')) return unauthorized(corsHeaders);

  try {
    const found = await getPost(params.id);
    if (!found) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await deletePost(found.file, found.sha, `Delete post: ${found.title}`);

    return new Response(JSON.stringify({ ok: true, deleted: found.file }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'GitHub API error', details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS({ request }) {
  return preflight(request, METHODS);
}
