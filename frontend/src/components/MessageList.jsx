import { useRef, useEffect, useCallback } from 'react';
import MessageItem from './MessageItem';

/**
 * Scrollable, lazy-loading message list.
 *
 * - Auto-scrolls to the bottom when new messages arrive (if already at bottom).
 * - Loads older messages via IntersectionObserver when scrolled to the top.
 */
export default function MessageList({ messages, channelId, onLoadMore }) {
  const containerRef = useRef(null);
  const topSentinelRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const prevChannelRef = useRef(channelId);
  const loadingRef = useRef(false);

  // Track scroll position to decide whether to auto-scroll
  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // Scroll to bottom when channel changes or first load
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (prevChannelRef.current !== channelId) {
      prevChannelRef.current = channelId;
      isAtBottomRef.current = true;
    }

    if (isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, channelId]);

  // IntersectionObserver on the top sentinel to load older messages
  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const el = containerRef.current;
    const prevScrollHeight = el ? el.scrollHeight : 0;

    try {
      await onLoadMore(channelId);
    } finally {
      loadingRef.current = false;
      // Keep scroll position stable after prepending messages
      if (el) {
        el.scrollTop = el.scrollHeight - prevScrollHeight;
      }
    }
  }, [channelId, onLoadMore]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { root: containerRef.current, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Group consecutive messages by same author within 5 minutes
  const grouped = groupMessages(messages);

  return (
    <div
      className="message-list"
      ref={containerRef}
      onScroll={handleScroll}
    >
      {/* Top sentinel – triggers load-more when visible */}
      <div ref={topSentinelRef} className="load-sentinel" />

      {grouped.map((group) => (
        <div key={group[0].id} className="message-group">
          {group.map((msg, i) => (
            <MessageItem key={msg.id} message={msg} isFirst={i === 0} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Group messages by author + within 5-minute windows */
function groupMessages(messages) {
  const groups = [];
  let current = null;

  for (const msg of messages) {
    if (
      current &&
      current[0].author?.id === msg.author?.id &&
      msg.timestamp - current[current.length - 1].timestamp < 5 * 60 * 1000
    ) {
      current.push(msg);
    } else {
      current = [msg];
      groups.push(current);
    }
  }

  return groups;
}
