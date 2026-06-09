import { Router } from 'express';
import { verifyPassword, createToken } from '../lib/auth.js';

const router = Router();
const VALID_SCOPES = ['analytics', 'legion'];

router.post('/api/auth', (req, res) => {
  const { password, scope } = req.body || {};

  if (!password || typeof password !== 'string' || !scope || typeof scope !== 'string') {
    return res.status(400).json({ error: 'Missing password or scope' });
  }
  if (password.length > 256) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  if (!VALID_SCOPES.includes(scope)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (!verifyPassword(password, scope)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = createToken(scope);
  res.json({ token });
});

export default router;
