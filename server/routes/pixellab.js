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
  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'Missing description' });
  }
  if (description.length > 2000) {
    return res.status(400).json({ error: 'Description too long' });
  }
  const w = Number(width);
  const h = Number(height);
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 1024 || h > 1024) {
    return res.status(400).json({ error: 'Invalid dimensions (1-1024)' });
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
        image_size: { width: w, height: h },
        negative_description: 'blurry, low quality, text, watermark',
      }),
    });

    if (!response.ok) {
      console.error('[pixellab] API error:', response.status, await response.text());
      return res.status(response.status).json({ error: `Image generation failed (${response.status})` });
    }

    const data = await response.json();
    res.json({ image: data.image.base64 });
  } catch (err) {
    console.error('[pixellab]', err);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

export default router;
