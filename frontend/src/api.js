/**
 * Thin API wrapper.  All paths are relative so the Vite proxy (dev) and
 * Express static serving (production) both work without configuration.
 */

const BASE = '/api';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  getStatus: () => request('GET', '/status'),
  login: (token) => request('POST', '/auth/token', { token }),
  getGuilds: () => request('GET', '/guilds'),
  getChannels: (guildId) => request('GET', `/channels/guild/${guildId}`),
  getMessages: (channelId, before) =>
    request('GET', `/messages/${channelId}${before ? `?before=${before}` : ''}`),
  sendMessage: (channelId, content) =>
    request('POST', `/messages/${channelId}`, { content }),
  getDMs: () => request('GET', '/dms'),
};
