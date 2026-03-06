'use strict';

const { Router } = require('express');
const authRouter = require('./auth');
const guildsRouter = require('./guilds');
const channelsRouter = require('./channels');
const messagesRouter = require('./messages');
const dmsRouter = require('./dms');
const { getBot } = require('../bot');

/**
 * @param {import('ws').WebSocketServer} wss
 * @returns {Router}
 */
function buildRoutes(wss) {
  const router = Router();

  router.use('/auth', authRouter(wss));
  router.use('/guilds', guildsRouter());
  router.use('/channels', channelsRouter());
  router.use('/messages', messagesRouter());
  router.use('/dms', dmsRouter());

  /** GET /api/status – bot connection status */
  router.get('/status', (req, res) => {
    const bot = getBot();
    if (!bot || !bot.user) {
      return res.json({ connected: false });
    }
    res.json({
      connected: true,
      user: {
        id: bot.user.id,
        username: bot.user.username,
        discriminator: bot.user.discriminator,
        avatar: bot.user.avatar,
        avatarURL: bot.user.displayAvatarURL({ size: 128 }),
        bot: bot.user.bot,
        tag: bot.user.tag,
      },
    });
  });

  return router;
}

module.exports = buildRoutes;
