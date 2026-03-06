/**
 * Left-most sidebar: round server icons + DM button + bot avatar.
 */
export default function ServerSidebar({
  guilds,
  selectedGuild,
  view,
  onSelectGuild,
  onSelectDMs,
  botUser,
}) {
  return (
    <aside className="server-sidebar">
      {/* DM / Home button */}
      <div
        className={`server-icon home-icon ${view === 'dms' ? 'active' : ''}`}
        title="Direct Messages"
        onClick={onSelectDMs}
      >
        <svg width="28" height="20" viewBox="0 0 28 20" fill="currentColor">
          <path d="M14 0L0 10h4v10h20V10h4L14 0z" />
        </svg>
      </div>

      <div className="server-divider" />

      {/* Guild list */}
      <div className="server-list">
        {guilds.map((guild) => (
          <GuildIcon
            key={guild.id}
            guild={guild}
            isActive={selectedGuild?.id === guild.id}
            onClick={() => onSelectGuild(guild)}
          />
        ))}
      </div>

      {/* Bot user avatar at the bottom */}
      {botUser && (
        <div className="bot-user-avatar" title={`${botUser.tag ?? botUser.username}`}>
          {botUser.avatarURL ? (
            <img src={botUser.avatarURL} alt={botUser.username} />
          ) : (
            <span>{botUser.username[0].toUpperCase()}</span>
          )}
          <span className="status-dot online" />
        </div>
      )}
    </aside>
  );
}

function GuildIcon({ guild, isActive, onClick }) {
  return (
    <div
      className={`server-icon ${isActive ? 'active' : ''}`}
      title={guild.name}
      onClick={onClick}
    >
      {guild.iconURL ? (
        <img src={guild.iconURL} alt={guild.name} />
      ) : (
        <span className="guild-initials">{acronym(guild.name)}</span>
      )}
    </div>
  );
}

function acronym(name) {
  return name
    .replace(/'s /g, ' ')
    .replace(/\w+/g, (w) => w[0])
    .slice(0, 4)
    .toUpperCase();
}
