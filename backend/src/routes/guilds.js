'use strict';

const { Router } = require('express');
const { getBot } = require('../bot');
const { serializeGuild } = require('../serializers');

function guildsRouter() {
  const router = Router();

  /** GET /api/guilds – list all guilds the bot is in */
  router.get('/', (req, res) => {
    const bot = getBot();
    if (!bot) return res.status(503).json({ error: 'Bot not connected' });

    const guilds = [...bot.guilds.cache.values()].map(serializeGuild);
    res.json(guilds);
  });

  /** GET /api/guilds/:guildId – single guild info */
  router.get('/:guildId', (req, res) => {
    const bot = getBot();
    if (!bot) return res.status(503).json({ error: 'Bot not connected' });

    const guild = bot.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    res.json(serializeGuild(guild));
  });

  return router;
}

module.exports = guildsRouter;
