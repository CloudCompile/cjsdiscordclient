import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { useWebSocket } from './hooks/useWebSocket';
import ServerSidebar from './components/ServerSidebar';
import ChannelSidebar from './components/ChannelSidebar';
import ChatArea from './components/ChatArea';

export default function App() {
  const [botUser, setBotUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [dms, setDMs] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [view, setView] = useState('guilds'); // 'guilds' | 'dms'

  // messages keyed by channelId
  const [messagesByChannel, setMessagesByChannel] = useState({});

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const handleWsEvent = useCallback((event) => {
    const { type, data } = event;

    if (type === 'MESSAGE_CREATE') {
      setMessagesByChannel((prev) => {
        const existing = prev[data.channelId] ?? [];
        // deduplicate
        if (existing.some((m) => m.id === data.id)) return prev;
        return { ...prev, [data.channelId]: [...existing, data] };
      });
    } else if (type === 'MESSAGE_UPDATE') {
      setMessagesByChannel((prev) => {
        const existing = prev[data.channelId];
        if (!existing) return prev;
        return {
          ...prev,
          [data.channelId]: existing.map((m) =>
            m.id === data.id ? { ...m, ...data } : m
          ),
        };
      });
    } else if (type === 'MESSAGE_DELETE') {
      setMessagesByChannel((prev) => {
        const existing = prev[data.channelId];
        if (!existing) return prev;
        return {
          ...prev,
          [data.channelId]: existing.filter((m) => m.id !== data.id),
        };
      });
    }
  }, []);

  useWebSocket(handleWsEvent);

  // ── Bootstrap: check connection status ───────────────────────────────────
  useEffect(() => {
    api
      .getStatus()
      .then((s) => {
        if (s.connected) {
          setBotUser(s.user);
        }
      })
      .catch(() => {});
  }, []);

  // ── Load guilds + DMs when bot connects ──────────────────────────────────
  useEffect(() => {
    if (!botUser) return;
    api.getGuilds().then(setGuilds).catch(console.error);
    api.getDMs().then(setDMs).catch(console.error);
  }, [botUser]);

  // ── Load messages when channel is selected ────────────────────────────────
  useEffect(() => {
    if (!selectedChannel) return;
    if (messagesByChannel[selectedChannel.id]) return; // already loaded
    api
      .getMessages(selectedChannel.id)
      .then((msgs) =>
        setMessagesByChannel((prev) => ({
          ...prev,
          [selectedChannel.id]: msgs,
        }))
      )
      .catch(console.error);
  }, [selectedChannel]);

  const loadMoreMessages = useCallback(
    async (channelId) => {
      const existing = messagesByChannel[channelId];
      if (!existing || existing.length === 0) return;
      const oldest = existing[0];
      const older = await api.getMessages(channelId, oldest.id);
      if (!older.length) return;
      setMessagesByChannel((prev) => ({
        ...prev,
        [channelId]: [...older, ...(prev[channelId] ?? [])],
      }));
    },
    [messagesByChannel]
  );

  const sendMessage = useCallback(
    async (channelId, content) => {
      await api.sendMessage(channelId, content);
      // The WS MESSAGE_CREATE event will add it to state automatically
    },
    []
  );

  // ── Auth handler ─────────────────────────────────────────────────────────
  const handleLogin = useCallback(async (token) => {
    const result = await api.login(token);
    setBotUser(result.user);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!botUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <ServerSidebar
        guilds={guilds}
        selectedGuild={selectedGuild}
        view={view}
        onSelectGuild={(g) => {
          setSelectedGuild(g);
          setView('guilds');
          setSelectedChannel(null);
        }}
        onSelectDMs={() => {
          setSelectedGuild(null);
          setView('dms');
          setSelectedChannel(null);
        }}
        botUser={botUser}
      />
      <ChannelSidebar
        guild={selectedGuild}
        dms={dms}
        view={view}
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
      />
      <ChatArea
        channel={selectedChannel}
        messages={selectedChannel ? (messagesByChannel[selectedChannel.id] ?? []) : []}
        onSendMessage={sendMessage}
        onLoadMore={loadMoreMessages}
        botUser={botUser}
      />
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token.trim()) return;
    setError('');
    setLoading(true);
    try {
      await onLogin(token.trim());
    } catch (err) {
      setError(err.message || 'Failed to connect. Check your token.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 127.14 96.36" fill="#7289da" xmlns="http://www.w3.org/2000/svg">
            <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-19.01-72.14zM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69z" />
          </svg>
        </div>
        <h1>Discord Bot Client</h1>
        <p className="login-subtitle">Enter your Discord bot token to connect</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="login-input"
            placeholder="Bot token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
            spellCheck={false}
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading || !token.trim()}>
            {loading ? 'Connecting…' : 'Connect'}
          </button>
        </form>
        <p className="login-hint">
          The token is sent to the backend only and never stored in the browser.
        </p>
      </div>
    </div>
  );
}
