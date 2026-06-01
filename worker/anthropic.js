// Direct Messages API wrapper. The browser path goes through the Agent SDK via
// /api/agent-sdk-chat, but the worker has no reason to route back through Netlify
// and pay a second timeout budget -- it just calls Anthropic directly.
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function ask({ system, userPrompt, model = 'claude-sonnet-4-20250514', maxTokens = 1024 }) {
  const res = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const text = res.content?.find((b) => b.type === 'text')?.text || '';
  return text;
}
