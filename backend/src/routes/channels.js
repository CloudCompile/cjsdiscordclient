'use strict';

const { Router } = require('express');
const { ChannelType } = require('discord.js');
const { getBot } = require('../bot');
const { serializeChannel } = require('../serializers');

function channelsRouter() {
  const router = Router();

  /** GET /api/channels/guild/:guildId – list text channels for a guild */
  router.get('/guild/:guildId', (req, res) => {
    const bot = getBot();
    if (!bot) return res.status(503).json({ error: 'Bot not connected' });

    const guild = bot.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const channels = [...guild.channels.cache.values()]
      .filter(
        (ch) =>
          ch.type === ChannelType.GuildText ||
          ch.type === ChannelType.GuildAnnouncement ||
          ch.type === ChannelType.GuildCategory ||
          ch.type === ChannelType.GuildForum
      )
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(serializeChannel);

    res.json(channels);
  });

  return router;
}

module.exports = channelsRouter;
