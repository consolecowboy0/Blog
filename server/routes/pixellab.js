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

  const w = Number(width);
  const h = Number(height);
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 16 || w > 512 || h < 16 || h > 512) {
    return res.status(400).json({ error: 'width and height must be integers between 16 and 512' });
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
