import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';

const router = Router();

router.post('/api/web-search', async (req, res) => {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'No Brave Search API key configured' });
  }

  const { query } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: 'Missing query' });
  }

  try {
    const params = new URLSearchParams({ q: query, count: '5' });
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Search request failed (${response.status})` });
    }

    const data = await response.json();
    const results = (data.web?.results || []).map(r => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));

    res.json({ results });
  } catch (err) {
    console.error('[web-search] error:', err.message);
    res.status(500).json({ error: 'Search request failed' });
  }
});

export default router;
