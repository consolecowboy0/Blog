const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'consolecowboy0/Blog';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const BASE_PATH = 'src/content/posts';

const [OWNER, REPO] = GITHUB_REPO.split('/');

const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'dustinlanders-blog-backend',
};

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { data: {}, body: raw };

  const frontmatterBlock = match[1];
  const body = raw.slice(match[0].length).replace(/^\n+/, '');
  const data = {};

  for (const line of frontmatterBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    data[key] = value;
  }

  return { data, body };
}

function decodeBase64(content) {
  return Buffer.from(content, 'base64').toString('utf-8');
}

function encodeBase64(text) {
  return Buffer.from(text).toString('base64');
}

async function githubFetch(endpoint, options = {}) {
  const url = `https://api.github.com${endpoint}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }

  return res.json();
}

export async function listPosts() {
  const entries = await githubFetch(
    `/repos/${OWNER}/${REPO}/contents/${BASE_PATH}?ref=${GITHUB_BRANCH}`
  );

  const mdFiles = entries.filter(
    (e) => e.type === 'file' && (e.name.endsWith('.md') || e.name.endsWith('.mdx'))
  );

  const posts = await Promise.all(
    mdFiles.map(async (file) => {
      try {
        const detail = await githubFetch(
          `/repos/${OWNER}/${REPO}/contents/${BASE_PATH}/${file.name}?ref=${GITHUB_BRANCH}`
        );
        const raw = decodeBase64(detail.content);
        const { data } = parseFrontmatter(raw);
        const id = file.name.replace(/\.mdx?$/, '');

        return {
          id,
          file: file.name,
          title: data.title || id,
          date: data.date || null,
          description: data.description || null,
          draft: data.draft || false,
          sha: detail.sha,
        };
      } catch (err) {
        console.error(`Failed to fetch ${file.name}:`, err.message);
        return null;
      }
    })
  );

  return posts
    .filter(Boolean)
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });
}

export async function getPost(id) {
  for (const ext of ['.md', '.mdx']) {
    const filename = `${id}${ext}`;
    try {
      const detail = await githubFetch(
        `/repos/${OWNER}/${REPO}/contents/${BASE_PATH}/${filename}?ref=${GITHUB_BRANCH}`
      );
      const raw = decodeBase64(detail.content);
      const { data, body } = parseFrontmatter(raw);

      return {
        id,
        file: filename,
        sha: detail.sha,
        title: data.title || id,
        date: data.date || null,
        description: data.description || null,
        draft: data.draft || false,
        content: body,
      };
    } catch {
      continue;
    }
  }

  return null;
}

export async function savePost(filename, fileContent, sha, message) {
  const body = {
    message: message || (sha ? `Update ${filename}` : `Create ${filename}`),
    content: encodeBase64(fileContent),
    branch: GITHUB_BRANCH,
  };

  if (sha) body.sha = sha;

  const res = await githubFetch(
    `/repos/${OWNER}/${REPO}/contents/${BASE_PATH}/${filename}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    }
  );

  return res;
}

export async function deletePost(filename, sha, message) {
  const body = {
    message: message || `Delete ${filename}`,
    sha,
    branch: GITHUB_BRANCH,
  };

  const res = await githubFetch(
    `/repos/${OWNER}/${REPO}/contents/${BASE_PATH}/${filename}`,
    {
      method: 'DELETE',
      body: JSON.stringify(body),
    }
  );

  return res;
}
