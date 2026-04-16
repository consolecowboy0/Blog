export const prerender = false;

import { requireAuth } from '../../../lib/auth.js';
import { getPost, savePost, deletePost } from '../../../lib/github-posts.js';
import { getCorsHeaders } from '../../../lib/cors.js';

export async function GET({ params, request }) {
  const cors = getCorsHeaders(request, 'GET, PUT, DELETE, OPTIONS');
  const auth = requireAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: cors,
    });
  }

  try {
    const post = await getPost(params.id);
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[posts/id] get error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT({ params, request }) {
  const cors = getCorsHeaders(request, 'GET, PUT, DELETE, OPTIONS');
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

  try {
    const found = await getPost(params.id);
    if (!found) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { title, date, description, draft, content } = body;

    let fm = `---\ntitle: "${title}"\ndate: "${date}"`;
    if (description) fm += `\ndescription: "${description}"`;
    if (draft) fm += `\ndraft: true`;
    fm += `\n---\n\n${content || ''}`;

    await savePost(found.file, fm, found.sha, `Update post: ${title}`);

    return new Response(JSON.stringify({ ok: true, file: found.file }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[posts/id] update error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE({ params, request }) {
  const cors = getCorsHeaders(request, 'GET, PUT, DELETE, OPTIONS');
  const auth = requireAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: cors,
    });
  }

  try {
    const found = await getPost(params.id);
    if (!found) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    await deletePost(found.file, found.sha, `Delete post: ${found.title}`);

    return new Response(JSON.stringify({ ok: true, deleted: found.file }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[posts/id] delete error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS({ request }) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request, 'GET, PUT, DELETE, OPTIONS') });
}
