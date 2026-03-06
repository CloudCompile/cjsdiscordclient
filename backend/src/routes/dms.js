'use strict';

const { Router } = require('express');
const { ChannelType } = require('discord.js');
const { getBot } = require('../bot');

function dmsRouter() {
  const router = Router();

  /** GET /api/dms – list all DM channels cached by the bot */
  router.get('/', (req, res) => {
    const bot = getBot();
    if (!bot) return res.status(503).json({ error: 'Bot not connected' });

    const dms = [...bot.channels.cache.values()]
      .filter((ch) => ch.type === ChannelType.DM)
      .map((ch) => ({
        id: ch.id,
        type: ch.type,
        recipient: ch.recipient
          ? {
              id: ch.recipient.id,
              username: ch.recipient.username,
              discriminator: ch.recipient.discriminator,
              avatar: ch.recipient.avatar,
              avatarURL: ch.recipient.displayAvatarURL({ size: 64 }),
            }
          : null,
        lastMessageId: ch.lastMessageId ?? null,
      }));

    res.json(dms);
  });

  return router;
}

module.exports = dmsRouter;
