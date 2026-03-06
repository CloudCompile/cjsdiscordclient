import { useState, useEffect } from 'react';
import { api } from '../api';
import { ChannelType } from '../constants';

/**
 * Second column: channel list for the selected guild OR DM list.
 */
export default function ChannelSidebar({
  guild,
  dms,
  view,
  selectedChannel,
  onSelectChannel,
}) {
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    if (!guild) {
      setChannels([]);
      return;
    }
    api
      .getChannels(guild.id)
      .then(setChannels)
      .catch(console.error);
  }, [guild?.id]);

  if (view === 'dms') {
    return (
      <nav className="channel-sidebar">
        <div className="channel-sidebar-header">
          <span>Direct Messages</span>
        </div>
        <div className="channel-list">
          {dms.length === 0 && (
            <p className="empty-hint">No DMs cached yet.</p>
          )}
          {dms.map((dm) => (
            <div
              key={dm.id}
              className={`channel-item ${selectedChannel?.id === dm.id ? 'active' : ''}`}
              onClick={() => onSelectChannel(dm)}
            >
              <div className="dm-avatar">
                {dm.recipient?.avatarURL ? (
                  <img src={dm.recipient.avatarURL} alt={dm.recipient.username} />
                ) : (
                  <span>{(dm.recipient?.username ?? '?')[0].toUpperCase()}</span>
                )}
              </div>
              <span className="channel-name">
                {dm.recipient?.username ?? 'Unknown User'}
              </span>
            </div>
          ))}
        </div>
      </nav>
    );
  }

  // Categorise channels
  const categories = channels.filter((c) => c.type === ChannelType.GuildCategory);
  const uncategorised = channels.filter(
    (c) =>
      c.type !== ChannelType.GuildCategory &&
      c.type !== ChannelType.GuildForum &&
      !c.parentId
  );

  return (
    <nav className="channel-sidebar">
      {guild && (
        <div className="channel-sidebar-header">
          <span className="guild-name">{guild.name}</span>
        </div>
      )}

      <div className="channel-list">
        {/* Uncategorised channels */}
        {uncategorised.map((ch) => (
          <ChannelItem
            key={ch.id}
            channel={ch}
            isActive={selectedChannel?.id === ch.id}
            onClick={() => onSelectChannel(ch)}
          />
        ))}

        {/* Category groups */}
        {categories.map((cat) => {
          const children = channels.filter(
            (c) =>
              c.parentId === cat.id &&
              c.type !== ChannelType.GuildCategory &&
              c.type !== ChannelType.GuildForum
          );
          if (children.length === 0) return null;
          return (
            <CategoryGroup
              key={cat.id}
              category={cat}
              channels={children}
              selectedChannel={selectedChannel}
              onSelect={onSelectChannel}
            />
          );
        })}
      </div>
    </nav>
  );
}

function CategoryGroup({ category, channels, selectedChannel, onSelect }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="category-group">
      <button
        className="category-header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <svg
          className={`caret ${collapsed ? 'collapsed' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M2 4l4 4 4-4H2z" />
        </svg>
        {category.name.toUpperCase()}
      </button>

      {!collapsed &&
        channels.map((ch) => (
          <ChannelItem
            key={ch.id}
            channel={ch}
            isActive={selectedChannel?.id === ch.id}
            onClick={() => onSelect(ch)}
          />
        ))}
    </div>
  );
}

function ChannelItem({ channel, isActive, onClick }) {
  return (
    <div
      className={`channel-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={channel.topic || channel.name}
    >
      <ChannelIcon type={channel.type} />
      <span className="channel-name">{channel.name}</span>
      {channel.nsfw && <span className="nsfw-badge">NSFW</span>}
    </div>
  );
}

function ChannelIcon({ type }) {
  if (type === ChannelType.GuildAnnouncement) {
    return (
      <svg className="channel-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
      </svg>
    );
  }
  return (
    <svg className="channel-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
    </svg>
  );
}
