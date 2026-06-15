import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import storyRoutes from './routes/story-chat.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? ['https://dustinlanders.com', 'https://www.dustinlanders.com']
  : ['https://dustinlanders.com', 'https://www.dustinlanders.com', 'http://localhost:4321', 'http://localhost:3000'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '7200');
  res.setHeader('Vary', 'Origin');
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '0');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rate limiting - strict on auth, moderate on everything else
app.use('/api/auth', rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts' },
}));
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests' },
}));

app.use(express.json({ limit: '1mb' }));

// Routes
app.use(authRoutes);
app.use(storyRoutes);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Legion API listening on port ${PORT}`);
});
