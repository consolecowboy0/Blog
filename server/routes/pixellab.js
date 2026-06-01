import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';

const router = Router();

router.post('/api/pixellab', async (req, res) => {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.PIXELLAB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'No PixelLab API key configured' });
  }

  const { description, width = 128, height = 128 } = req.body || {};
  if (!description) {
    return res.status(400).json({ error: 'Missing description' });
  }

  try {
    const response = await fetch('https://api.pixellab.ai/v1/generate-image-pixflux', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        description,
        image_size: { width, height },
        negative_description: 'blurry, low quality, text, watermark',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `PixelLab error (${response.status}): ${err}` });
    }

    const data = await response.json();
    res.json({ image: data.image.base64 });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to call PixelLab' });
  }
});

export default router;
