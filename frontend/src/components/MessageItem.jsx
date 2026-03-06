import { memo } from 'react';

/**
 * A single message row.
 * `isFirst` controls whether the author avatar + name are shown (grouped style).
 */
const MessageItem = memo(function MessageItem({ message, isFirst }) {
  const { author, content, timestamp, editedTimestamp, attachments, embeds } = message;

  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const date = new Date(timestamp).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`message-item ${isFirst ? 'first-in-group' : 'continuation'}`}>
      {isFirst ? (
        <div className="message-avatar">
          {author?.avatarURL ? (
            <img src={author.avatarURL} alt={author.username} loading="lazy" />
          ) : (
            <div className="avatar-fallback">
              {(author?.username ?? '?')[0].toUpperCase()}
            </div>
          )}
        </div>
      ) : (
        <div className="message-timestamp-col">
          <span className="message-mini-time">{time}</span>
        </div>
      )}

      <div className="message-content-col">
        {isFirst && (
          <div className="message-header">
            <span className="message-author">
              {author?.username ?? 'Unknown'}
              {author?.bot && <span className="bot-badge">BOT</span>}
            </span>
            <span className="message-timestamp" title={date}>
              {formatRelativeDate(timestamp)}
            </span>
          </div>
        )}

        {content && (
          <p className="message-text">
            <MessageContent text={content} />
          </p>
        )}

        {attachments?.map((att) => (
          <Attachment key={att.id} attachment={att} />
        ))}

        {embeds?.map((embed, i) => (
          <Embed key={i} embed={embed} />
        ))}

        {editedTimestamp && (
          <span className="edited-label">(edited)</span>
        )}
      </div>
    </div>
  );
});

export default MessageItem;

// ── Sub-components ────────────────────────────────────────────────────────────

function Attachment({ attachment }) {
  const isImage = attachment.contentType?.startsWith('image/');

  if (isImage) {
    return (
      <div className="attachment image-attachment">
        <img
          src={attachment.url}
          alt={attachment.name}
          loading="lazy"
          className="attachment-img"
        />
      </div>
    );
  }

  return (
    <div className="attachment file-attachment">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
      </svg>
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="attachment-link"
      >
        {attachment.name}
      </a>
      {attachment.size && (
        <span className="attachment-size">{formatBytes(attachment.size)}</span>
      )}
    </div>
  );
}

function Embed({ embed }) {
  if (!embed.title && !embed.description) return null;
  return (
    <div
      className="embed"
      style={embed.color ? { borderLeftColor: `#${embed.color.toString(16).padStart(6, '0')}` } : {}}
    >
      {embed.thumbnail && (
        <img src={embed.thumbnail} alt="" className="embed-thumbnail" loading="lazy" />
      )}
      {embed.title && (
        <p className="embed-title">
          {embed.url ? (
            <a href={embed.url} target="_blank" rel="noreferrer">{embed.title}</a>
          ) : (
            embed.title
          )}
        </p>
      )}
      {embed.description && (
        <p className="embed-description">{embed.description}</p>
      )}
      {embed.image && (
        <img src={embed.image} alt="" className="embed-image" loading="lazy" />
      )}
    </div>
  );
}

/** Minimal Discord markdown renderer (no DOMPurify needed – text only, no HTML) */
function MessageContent({ text }) {
  // Split text into segments: code blocks, inline code, bold, italic, etc.
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {renderInline(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function renderInline(text) {
  // Patterns handled: **bold**, *italic*, __underline__, ~~strike~~, `code`, ||spoiler||
  const parts = [];
  let remaining = text;
  let key = 0;

  const patterns = [
    { re: /\*\*(.+?)\*\*/s, tag: 'strong' },
    { re: /\*(.+?)\*/s, tag: 'em' },
    { re: /__(.+?)__/s, tag: 'u' },
    { re: /~~(.+?)~~/s, tag: 'del' },
    { re: /`(.+?)`/s, tag: 'code' },
    { re: /\|\|(.+?)\|\|/s, tag: 'spoiler' },
  ];

  while (remaining.length > 0) {
    let earliest = null;
    let earliestIndex = Infinity;

    for (const p of patterns) {
      const m = p.re.exec(remaining);
      if (m && m.index < earliestIndex) {
        earliest = { match: m, tag: p.tag };
        earliestIndex = m.index;
      }
    }

    if (!earliest) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    const { match, tag } = earliest;

    if (match.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, match.index)}</span>);
    }

    if (tag === 'spoiler') {
      parts.push(<SpoilerSpan key={key++} text={match[1]} />);
    } else {
      const Tag = tag;
      parts.push(
        <Tag key={key++}>{renderInline(match[1])}</Tag>
      );
    }

    remaining = remaining.slice(match.index + match[0].length);
  }

  return parts;
}

function SpoilerSpan({ text }) {
  return (
    <span
      className="spoiler"
      onClick={(e) => e.currentTarget.classList.toggle('revealed')}
    >
      {text}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeDate(ts) {
  const now = Date.now();
  const diff = now - ts;
  const secs = diff / 1000;
  const hours = secs / 3600;
  const days = hours / 24;

  const timeStr = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (hours < 24) return `Today at ${timeStr}`;
  if (days < 2) return `Yesterday at ${timeStr}`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
