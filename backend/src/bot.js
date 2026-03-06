'use strict';

const {
  Client,
  GatewayIntentBits,
  Partials,
} = require('discord.js');

const { broadcast } = require('./wsServer');
const { serializeMessage } = require('./serializers');

/** @type {Client|null} */
let _client = null;

/**
 * Create and login a new discord.js Client with the given token.
 * Re-calling this replaces the previous client.
 *
 * @param {string} token
 * @param {import('ws').WebSocketServer} wss
 * @returns {Promise<Client>}
 */
async function initBot(token, wss) {
  if (_client) {
    _client.removeAllListeners();
    _client.destroy();
    _client = null;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  // ── Event forwarding ────────────────────────────────────────────────────────
  client.on('messageCreate', (msg) => {
    broadcast(wss, { type: 'MESSAGE_CREATE', data: serializeMessage(msg) });
  });

  client.on('messageUpdate', (_old, msg) => {
    broadcast(wss, { type: 'MESSAGE_UPDATE', data: serializeMessage(msg) });
  });

  client.on('messageDelete', (msg) => {
    broadcast(wss, {
      type: 'MESSAGE_DELETE',
      data: { id: msg.id, channelId: msg.channelId, guildId: msg.guildId },
    });
  });

  client.on('typingStart', (typing) => {
    broadcast(wss, {
      type: 'TYPING_START',
      data: {
        channelId: typing.channel.id,
        userId: typing.user.id,
        username: typing.user.username,
      },
    });
  });

  await new Promise((resolve, reject) => {
    client.once('ready', resolve);
    client.once('error', reject);
    client.login(token).catch(reject);
  });

  _client = client;
  return client;
}

/** Returns the current discord.js Client, or null if not connected. */
function getBot() {
  return _client;
}

module.exports = { initBot, getBot };
