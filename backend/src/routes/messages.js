'use strict';

const { Router } = require('express');
const { getBot } = require('../bot');
const { serializeMessage } = require('../serializers');

function messagesRouter() {
  const router = Router();

  /**
   * GET /api/messages/:channelId
   * Query params:
   *   limit  – number of messages (default 50, max 100)
   *   before – message ID for pagination (older messages)
   */
  router.get('/:channelId', async (req, res) => {
    const bot = getBot();
    if (!bot) return res.status(503).json({ error: 'Bot not connected' });

    const channel = bot.channels.cache.get(req.params.channelId)
      || await bot.channels.fetch(req.params.channelId).catch(() => null);

    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const options = { limit };
    if (req.query.before) options.before = req.query.before;

    try {
      const messages = await channel.messages.fetch(options);
      const sorted = [...messages.values()]
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
        .map(serializeMessage);
      res.json(sorted);
    } catch (err) {
      console.error('Fetch messages error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/messages/:channelId
   * Body: { content: "..." }
   */
  router.post('/:channelId', async (req, res) => {
    const bot = getBot();
    if (!bot) return res.status(503).json({ error: 'Bot not connected' });

    const { content } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    const channel = bot.channels.cache.get(req.params.channelId)
      || await bot.channels.fetch(req.params.channelId).catch(() => null);

    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    try {
      const msg = await channel.send(content.trim());
      res.json(serializeMessage(msg));
    } catch (err) {
      console.error('Send message error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = messagesRouter;
