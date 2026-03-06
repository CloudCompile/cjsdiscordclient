import MessageList from './MessageList';
import MessageInput from './MessageInput';

/**
 * Main content area: header + message list + input box.
 */
export default function ChatArea({
  channel,
  messages,
  onSendMessage,
  onLoadMore,
  botUser,
}) {
  if (!channel) {
    return (
      <main className="chat-area empty-state">
        <div className="empty-state-inner">
          <svg width="72" height="72" viewBox="0 0 127.14 96.36" fill="#4f545c" xmlns="http://www.w3.org/2000/svg">
            <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-19.01-72.14zM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69z" />
          </svg>
          <p>Select a channel to start chatting</p>
        </div>
      </main>
    );
  }

  const isDM = channel.type === 1;
  const headerName = isDM
    ? (channel.recipient?.username ?? 'DM')
    : `#${channel.name}`;

  return (
    <main className="chat-area">
      <header className="chat-header">
        {isDM ? (
          <svg className="channel-icon-header" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        ) : (
          <svg className="channel-icon-header" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        )}
        <span className="chat-header-name">{headerName}</span>
        {channel.topic && (
          <>
            <span className="chat-header-divider">|</span>
            <span className="chat-header-topic">{channel.topic}</span>
          </>
        )}
      </header>

      <MessageList
        messages={messages}
        channelId={channel.id}
        onLoadMore={onLoadMore}
      />

      <MessageInput
        channelId={channel.id}
        channelName={headerName}
        onSend={onSendMessage}
        botUser={botUser}
      />
    </main>
  );
}
