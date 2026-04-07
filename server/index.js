import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/agent-sdk-chat.js';
import pixelRoutes from './routes/pixellab.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
const ALLOWED_ORIGINS = [
  'https://dustinlanders.com',
  'https://www.dustinlanders.com',
  'http://localhost:4321',
  'http://localhost:3000',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests' },
}));

app.use(express.json({ limit: '1mb' }));

// Routes
app.use(authRoutes);
app.use(chatRoutes);
app.use(pixelRoutes);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Legion API listening on port ${PORT}`);
});
