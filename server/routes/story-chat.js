import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';

const router = Router();

router.post('/api/story-chat', async (req, res) => {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { system, messages, model } = req.body || {};

  if (!system || !messages) {
    return res.status(400).json({ error: 'Missing system or messages' });
  }

  if (typeof system !== 'string' || system.length > 50000) {
    return res.status(400).json({ error: 'System prompt too long' });
  }
  if (!Array.isArray(messages) || messages.length > 50) {
    return res.status(400).json({ error: 'Too many messages' });
  }
  const totalLen = messages.reduce((n, m) => n + (typeof m.content === 'string' ? m.content.length : 0), 0);
  if (totalLen > 100000) {
    return res.status(400).json({ error: 'Message content too long' });
  }

  try {
    // Never use an API key -- run on the server's Claude Code subscription auth.
    delete process.env.ANTHROPIC_API_KEY;

    const { query } = await import('@anthropic-ai/claude-agent-sdk');
    console.log('[story-chat] Starting query');

    const userPrompt = messages[messages.length - 1]?.content || '';

    const sdkModel = model?.includes('opus') ? 'opus'
      : model?.includes('haiku') ? 'haiku'
      : 'sonnet';

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
      console.error('[story-chat] SDK auth error:', result);
      return res.status(401).json({ error: 'Authentication error' });
    }

    res.json({ text: result });
  } catch (err) {
    const message = err.message || '';
    console.error('[story-chat] Error:', message);
    if (message.includes('MODULE_NOT_FOUND') || message.includes('Cannot find') || message.includes('not found')) {
      return res.status(501).json({ error: 'Service temporarily unavailable' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
