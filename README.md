# Discord Bot Web Client

A lightweight, Discord-inspired web client for bot accounts. Built with **React** (frontend) and **Node.js + discord.js** (backend).

---

## Features

- 🔐 Authenticate with a Discord **bot token** (no OAuth, no user accounts)
- 🖥️ Discord-like dark UI – server list, channel list, chat area
- 📬 DM section for messages sent directly to the bot
- ⚡ Real-time message updates via **WebSockets**
- 📜 Lazy-loading of older messages (scroll-to-top pagination)
- 📎 Image previews, file attachments, and embeds
- 🚀 One-click deploy to **Render**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5 |
| Backend | Node.js, Express 4, discord.js 14 |
| Real-time | WebSocket (`ws`) |
| Deploy | Render |

---

## Local Development

### Prerequisites

- Node.js ≥ 18
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))

### 1 – Clone & install

```bash
git clone https://github.com/CloudCompile/cjsdiscordclient.git
cd cjsdiscordclient

# Install backend deps
npm install --prefix backend

# Install frontend deps
npm install --prefix frontend
```

### 2 – Configure the backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set DISCORD_BOT_TOKEN=your_token_here
```

> **Tip:** if you leave `DISCORD_BOT_TOKEN` blank in `.env`, you will be prompted to enter the token in the browser UI. The token is only ever stored in the backend process memory.

### 3 – Run

Open **two terminals**:

```bash
# Terminal 1 – backend (port 3001)
npm run dev:backend

# Terminal 2 – frontend (port 5173, proxied to backend)
npm run dev:frontend
```

Then open [http://localhost:5173](http://localhost:5173).

---

## Production Build

```bash
npm run build          # builds frontend → frontend/dist/
npm start              # starts Express, serves frontend + API on port 3001
```

---

## Deploy to Render (one-click)

1. Fork this repository.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New → Blueprint** and connect your fork.
3. Render reads `render.yaml` automatically.
4. Set the `DISCORD_BOT_TOKEN` environment variable in the Render service settings.
5. Deploy!

Alternatively click the button below (you still need to set `DISCORD_BOT_TOKEN` after deployment):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

## Project Structure

```
cjsdiscordclient/
├── backend/
│   ├── src/
│   │   ├── index.js          # HTTP + WebSocket server bootstrap
│   │   ├── bot.js            # discord.js Client setup & event forwarding
│   │   ├── serializers.js    # Convert Discord objects → plain JSON
│   │   ├── wsServer.js       # WebSocket server & broadcast helper
│   │   └── routes/
│   │       ├── index.js      # Route aggregator
│   │       ├── auth.js       # POST /api/auth/token
│   │       ├── guilds.js     # GET  /api/guilds
│   │       ├── channels.js   # GET  /api/channels/guild/:id
│   │       ├── messages.js   # GET/POST /api/messages/:channelId
│   │       └── dms.js        # GET  /api/dms
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx           # Root component + login screen
│   │   ├── api.js            # Fetch wrapper for backend API
│   │   ├── constants.js      # ChannelType enum
│   │   ├── components/
│   │   │   ├── ServerSidebar.jsx
│   │   │   ├── ChannelSidebar.jsx
│   │   │   ├── ChatArea.jsx
│   │   │   ├── MessageList.jsx   # Lazy-loading, scroll-anchored
│   │   │   ├── MessageItem.jsx   # Grouped messages + markdown
│   │   │   └── MessageInput.jsx  # Auto-resize textarea
│   │   ├── hooks/
│   │   │   └── useWebSocket.js   # Auto-reconnecting WS hook
│   │   └── styles/
│   │       └── app.css           # Discord dark theme
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── render.yaml
├── package.json
└── README.md
```

---

## Required Bot Permissions

Make sure your bot has these permissions in the Discord Developer Portal:

- **Privileged Gateway Intents** (under Bot settings):
  - `MESSAGE CONTENT INTENT` ✅
  - `SERVER MEMBERS INTENT` (optional)
- Bot permission scopes: `bot`, `applications.commands`
- Permissions: `Read Messages/View Channels`, `Send Messages`, `Read Message History`

---

## Security Notes

- The bot token is **never stored in the browser** – it is only held in the backend process memory (or loaded from the `.env` file on the server).
- The backend uses in-memory state; restarting the server requires re-entering the token via the UI (or setting it in `.env`).
- CORS is enabled for development; restrict origins in production as needed.
