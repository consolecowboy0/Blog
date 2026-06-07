import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';

delete process.env.ANTHROPIC_API_KEY;

const router = Router();

router.post('/api/story-chat', async (req, res) => {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { system, messages, model } = req.body || {};

  if (!system || typeof system !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid system prompt' });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid messages' });
  }
  if (system.length > 10000) {
    return res.status(400).json({ error: 'System prompt too long' });
  }

  try {
    const { query } = await import('@anthropic-ai/claude-agent-sdk');
    console.log('[story-chat] Starting query');

    const userPrompt = messages[messages.length - 1]?.content || '';
    if (typeof userPrompt !== 'string' || userPrompt.length > 10000) {
      return res.status(400).json({ error: 'Invalid message content' });
    }

    const ALLOWED_MODELS = ['opus', 'sonnet', 'haiku'];
    const sdkModel = typeof model === 'string' && model.includes('opus') ? 'opus'
      : typeof model === 'string' && model.includes('haiku') ? 'haiku'
      : 'sonnet';
    if (!ALLOWED_MODELS.includes(sdkModel)) {
      return res.status(400).json({ error: 'Invalid model' });
    }

    const options = {
      model: sdkModel,
      systemPrompt: system,
      maxTurns: 1,
      permissionMode: 'auto',
    };

    let result = '';
    for await (const message of query({ prompt: userPrompt, options })) {
      if (message.type === 'result' && message.subtype === 'success') {
        result = message.result;
        break;
      }
      if (message.type === 'assistant' && message.message?.content) {
        for (const block of message.message.content) {
          if (block.type === 'text') {
            result = block.text;
          }
        }
      }
    }

    console.log('[story-chat] Complete, result length=%d', result.length);

    if (result && (result.includes('Invalid API key') || result.includes('Fix external API key'))) {
      return res.status(502).json({ error: 'Upstream authentication failed' });
    }

    res.json({ text: result });
  } catch (err) {
    const message = err.message || '';
    if (message.includes('MODULE_NOT_FOUND') || message.includes('Cannot find') || message.includes('not found')) {
      return res.status(501).json({ error: 'Agent SDK requires Claude Code CLI installed on the server.' });
    }
    console.error('[story-chat] Error:', message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
