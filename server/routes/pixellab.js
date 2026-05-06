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

  const { description } = req.body || {};
  const width = Math.min(Math.max(Number(req.body?.width) || 128, 16), 512);
  const height = Math.min(Math.max(Number(req.body?.height) || 128, 16), 512);
  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'Missing description' });
  }
  if (description.length > 2000) {
    return res.status(400).json({ error: 'Description too long' });
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
      return res.status(response.status).json({ error: `Image generation failed (${response.status})` });
    }

    const data = await response.json();
    res.json({ image: data.image.base64 });
  } catch (err) {
    console.error('[pixellab] error:', err.message);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

export default router;
