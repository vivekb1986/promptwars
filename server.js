require('dotenv').config();

const express = require('express');
const path    = require('path');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRouter = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Apply rate limiter to all /api routes
app.use('/api', apiLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// Serve index.html for all other GET requests (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Learning Assistant running at http://localhost:${PORT}\n`);
});
