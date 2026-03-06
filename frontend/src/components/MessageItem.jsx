import { memo } from 'react';

/**
 * A single message row.
 * `isFirst` controls whether the author avatar + name are shown (grouped style).
 */
const MessageItem = memo(function MessageItem({ message, isFirst }) {
  const { author, content, timestamp, editedTimestamp, attachments, embeds, mentions } = message;

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
            <MessageContent text={content} mentions={mentions} />
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
  const isVideo = attachment.contentType?.startsWith('video/');

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

  if (isVideo) {
    return (
      <div className="attachment video-attachment">
        <video
          src={attachment.url}
          className="attachment-video"
          controls
          muted
          loop
          playsInline
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
  // GIF / video embed (Tenor, Giphy, etc.)
  if (embed.type === 'gifv' && embed.video) {
    return (
      <div className="attachment video-attachment">
        <video
          src={embed.video}
          className="attachment-video"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
    );
  }

  if (!embed.title && !embed.description && !embed.image && !embed.author) return null;

  return (
    <div
      className="embed"
      style={embed.color ? { borderLeftColor: `#${embed.color.toString(16).padStart(6, '0')}` } : {}}
    >
      {embed.author && (
        <div className="embed-author">
          {embed.author.iconURL && (
            <img src={embed.author.iconURL} alt="" className="embed-author-icon" loading="lazy" />
          )}
          {embed.author.url ? (
            <a href={embed.author.url} target="_blank" rel="noreferrer">{embed.author.name}</a>
          ) : (
            embed.author.name
          )}
        </div>
      )}
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
      {embed.fields?.length > 0 && (
        <div className="embed-fields">
          {embed.fields.map((f, i) => (
            <div key={i} className={`embed-field${f.inline ? ' inline' : ''}`}>
              <p className="embed-field-name">{f.name}</p>
              <p className="embed-field-value">{f.value}</p>
            </div>
          ))}
        </div>
      )}
      {embed.image && (
        <img src={embed.image} alt="" className="embed-image" loading="lazy" />
      )}
      {embed.footer && (
        <div className="embed-footer">
          {embed.footer.iconURL && (
            <img src={embed.footer.iconURL} alt="" className="embed-footer-icon" loading="lazy" />
          )}
          <span>{embed.footer.text}</span>
        </div>
      )}
    </div>
  );
}

/** Discord-style markdown renderer */
function MessageContent({ text, mentions }) {
  const blocks = parseTopLevel(text);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'codeblock') {
          return (
            <pre key={i} className="code-block">
              {block.lang && <span className="code-block-lang">{block.lang}</span>}
              <code>{block.content}</code>
            </pre>
          );
        }
        if (block.type === 'blockquote') {
          return (
            <blockquote key={i} className="message-blockquote">
              <MessageContent text={block.content} mentions={mentions} />
            </blockquote>
          );
        }
        // Plain text segment: render line-by-line with inline formatting
        const lines = block.content.split('\n');
        return (
          <span key={i}>
            {lines.map((line, j) => (
              <span key={j}>
                {renderInline(line, mentions)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}

/** Split raw message text into top-level blocks: codeblocks, blockquotes, plain text */
function parseTopLevel(text) {
  const blocks = [];
  const codeBlockRe = /```([^\n`]*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m;

  while ((m = codeBlockRe.exec(text)) !== null) {
    if (m.index > last) {
      extractBlockquotes(text.slice(last, m.index), blocks);
    }
    blocks.push({ type: 'codeblock', lang: m[1].trim(), content: m[2] });
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    extractBlockquotes(text.slice(last), blocks);
  }

  return blocks.length ? blocks : [{ type: 'text', content: text }];
}

/** Split a text chunk into blockquote and plain-text blocks */
function extractBlockquotes(text, blocks) {
  const lines = text.split('\n');
  let i = 0;
  let textLines = [];

  const flushText = () => {
    if (textLines.length) {
      blocks.push({ type: 'text', content: textLines.join('\n') });
      textLines = [];
    }
  };

  while (i < lines.length) {
    if (lines[i].startsWith('> ') || lines[i] === '>') {
      flushText();
      const quoteLines = [];
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        quoteLines.push(lines[i].slice(lines[i].startsWith('> ') ? 2 : 1));
        i++;
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join('\n') });
    } else {
      textLines.push(lines[i]);
      i++;
    }
  }

  flushText();
}

/** Render a single line with inline markdown, mentions, emoji, and auto-links */
function renderInline(text, mentions) {
  const userMap = {};
  (mentions?.users ?? []).forEach((u) => { userMap[u.id] = u.username; });

  const parts = [];
  let remaining = text;
  let key = 0;

  const patterns = [
    // Inline code (no nested formatting inside)
    { re: /`([^`\n]+)`/, tag: 'code' },
    // Bold+italic (must precede bold and italic individually)
    { re: /\*\*\*(.+?)\*\*\*/s, tag: 'bolditalic' },
    // Bold
    { re: /\*\*(.+?)\*\*/s, tag: 'strong' },
    // Italic (asterisk) — no newlines in content
    { re: /\*([^*\n]+)\*/, tag: 'em' },
    // Underline (must precede single-underscore italic)
    { re: /__(.+?)__/s, tag: 'u' },
    // Italic (underscore)
    { re: /_([^_\n]+)_/, tag: 'em' },
    // Strikethrough
    { re: /~~(.+?)~~/s, tag: 'del' },
    // Spoiler
    { re: /\|\|(.+?)\|\|/s, tag: 'spoiler' },
    // Animated custom emoji  <a:name:id>
    { re: /<a:(\w+):(\d+)>/, tag: 'animated-emoji' },
    // Static custom emoji  <:name:id>
    { re: /<:(\w+):(\d+)>/, tag: 'custom-emoji' },
    // User mention  <@id> or <@!id>
    { re: /<@!?(\d+)>/, tag: 'user-mention' },
    // Channel mention  <#id>
    { re: /<#(\d+)>/, tag: 'channel-mention' },
    // Role mention  <@&id>
    { re: /<@&(\d+)>/, tag: 'role-mention' },
    // Auto-link URLs
    { re: /https?:\/\/[^\s<>"]+(?<![.,;:!?)'">`\]])/, tag: 'url' },
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

    if (tag === 'code') {
      parts.push(<code key={key++}>{match[1]}</code>);
    } else if (tag === 'spoiler') {
      parts.push(<SpoilerSpan key={key++} text={match[1]} />);
    } else if (tag === 'bolditalic') {
      parts.push(<strong key={key++}><em>{renderInline(match[1], mentions)}</em></strong>);
    } else if (tag === 'user-mention') {
      const username = userMap[match[1]] || match[1];
      parts.push(<span key={key++} className="mention">@{username}</span>);
    } else if (tag === 'channel-mention') {
      parts.push(<span key={key++} className="mention">#{match[1]}</span>);
    } else if (tag === 'role-mention') {
      parts.push(<span key={key++} className="mention role-mention">@role</span>);
    } else if (tag === 'animated-emoji') {
      parts.push(
        <img
          key={key++}
          className="custom-emoji"
          src={`https://cdn.discordapp.com/emojis/${match[2]}.gif`}
          alt={`:${match[1]}:`}
          title={`:${match[1]}:`}
        />
      );
    } else if (tag === 'custom-emoji') {
      parts.push(
        <img
          key={key++}
          className="custom-emoji"
          src={`https://cdn.discordapp.com/emojis/${match[2]}.webp`}
          alt={`:${match[1]}:`}
          title={`:${match[1]}:`}
        />
      );
    } else if (tag === 'url') {
      parts.push(
        <a key={key++} href={match[0]} target="_blank" rel="noreferrer">
          {match[0]}
        </a>
      );
    } else {
      const Tag = tag;
      parts.push(<Tag key={key++}>{renderInline(match[1], mentions)}</Tag>);
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

