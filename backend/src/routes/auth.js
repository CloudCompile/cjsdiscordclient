'use strict';

const { Router } = require('express');
const { initBot } = require('../bot');

/**
 * @param {import('ws').WebSocketServer} wss
 * @returns {Router}
 */
function authRouter(wss) {
  const router = Router();

  /**
   * POST /api/auth/token
   * Body: { token: "<discord bot token>" }
   * Connects (or reconnects) the Discord bot.
   */
  router.post('/token', async (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ error: 'token is required' });
    }

    try {
      const client = await initBot(token.trim(), wss);
      res.json({
        ok: true,
        user: {
          id: client.user.id,
          username: client.user.username,
          discriminator: client.user.discriminator,
          avatar: client.user.avatar,
          avatarURL: client.user.displayAvatarURL({ size: 128 }),
          bot: client.user.bot,
          tag: client.user.tag,
        },
      });
    } catch (err) {
      console.error('Auth error:', err.message);
      res.status(401).json({ error: 'Invalid token or could not connect.' });
    }
  });

  return router;
}

module.exports = authRouter;
