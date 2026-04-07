import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';

const router = Router();

router.post('/api/agent-sdk-chat', async (req, res) => {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { system, messages, model, agentConfig } = req.body || {};

  if (!system || !messages) {
    return res.status(400).json({ error: 'Missing system or messages' });
  }

  try {
    delete process.env.ANTHROPIC_API_KEY;

    const { query } = await import('@anthropic-ai/claude-agent-sdk');
    console.log('[agent-sdk-chat] Starting query');

    const userPrompt = messages[messages.length - 1]?.content || '';

    const sdkModel = model?.includes('opus') ? 'opus'
      : model?.includes('haiku') ? 'haiku'
      : 'sonnet';

    const options = {
      model: sdkModel,
      systemPrompt: system,
      maxTurns: 1,
      permissionMode: 'default',
    };

    if (agentConfig && Object.keys(agentConfig).length > 0) {
      options.agents = agentConfig;
      options.allowedTools = ['Agent'];
    }

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

    console.log('[agent-sdk-chat] Complete, result length=%d', result.length);

    if (result && (result.includes('Invalid API key') || result.includes('Fix external API key'))) {
      return res.status(401).json({ error: 'Agent SDK auth error: ' + result });
    }

    res.json({ text: result });
  } catch (err) {
    const message = err.message || '';
    if (message.includes('MODULE_NOT_FOUND') || message.includes('Cannot find') || message.includes('not found')) {
      return res.status(501).json({ error: 'Agent SDK requires Claude Code CLI installed on the server.' });
    }
    res.status(500).json({ error: message || 'Failed to call Agent SDK' });
  }
});

export default router;
