import { Router } from 'express';
import { verifyPassword, createToken } from '../lib/auth.js';

const router = Router();

router.post('/api/auth', (req, res) => {
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }

  const { password, scope } = req.body || {};

  if (!password || !scope) {
    return res.status(400).json({ error: 'Missing password or scope' });
  }
  if (!['analytics'].includes(scope)) {
    return res.status(400).json({ error: 'Invalid scope' });
  }
  if (!verifyPassword(password, scope)) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  const token = createToken(scope);
  res.setHeader('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);
  res.json({ token });
});

export default router;
