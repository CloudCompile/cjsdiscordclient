'use strict';

const WebSocket = require('ws');

/** @type {import('ws').WebSocketServer|null} */
let _wss = null;

/**
 * Attach a ws.WebSocketServer to an existing http.Server.
 * @param {import('http').Server} server
 * @returns {import('ws').WebSocketServer}
 */
function createWsServer(server) {
  _wss = new WebSocket.Server({ server, path: '/ws' });

  _wss.on('connection', (ws, req) => {
    console.log(`WS client connected  [${req.socket.remoteAddress}]`);

    ws.on('close', () => {
      console.log(`WS client disconnected [${req.socket.remoteAddress}]`);
    });

    ws.on('error', (err) => {
      console.error('WS error:', err.message);
    });
  });

  return _wss;
}

/**
 * Send a JSON payload to every connected WebSocket client.
 * @param {import('ws').WebSocketServer} wss
 * @param {object} payload
 */
function broadcast(wss, payload) {
  if (!wss) return;
  const raw = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(raw);
    }
  });
}

module.exports = { createWsServer, broadcast };
