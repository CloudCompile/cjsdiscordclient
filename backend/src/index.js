'use strict';

require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createWsServer } = require('./wsServer');
const { initBot, getBot } = require('./bot');
const buildRoutes = require('./routes');

const app = express();
const server = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limit on auth endpoint to slow token-brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

// Rate limiter for static / SPA serving
const staticLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = createWsServer(server);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
app.use('/api', buildRoutes(wss));

// ── Serve built frontend in production ───────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', staticLimiter, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

async function start() {
  if (process.env.DISCORD_BOT_TOKEN) {
    try {
      await initBot(process.env.DISCORD_BOT_TOKEN, wss);
      console.log('Discord bot connected via env token.');
    } catch (err) {
      console.warn('Could not connect bot from env token:', err.message);
    }
  }

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();
