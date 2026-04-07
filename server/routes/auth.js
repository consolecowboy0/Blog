import { Router } from 'express';
import { verifyPassword, createToken } from '../lib/auth.js';

const router = Router();

router.post('/api/auth', (req, res) => {
  const { password, scope } = req.body || {};

  if (!password || !scope) {
    return res.status(400).json({ error: 'Missing password or scope' });
  }
  if (!['legion', 'dev'].includes(scope)) {
    return res.status(400).json({ error: 'Invalid scope' });
  }
  if (!verifyPassword(password, scope)) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  const token = createToken(scope);
  res.json({ token });
});

export default router;
