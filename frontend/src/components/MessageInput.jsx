import { useState, useRef, useCallback } from 'react';

/**
 * Message composition input at the bottom of the chat area.
 */
export default function MessageInput({ channelId, channelName, onSend, botUser }) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  const submit = useCallback(async () => {
    const content = value.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      await onSend(channelId, content);
      setValue('');
    } catch (err) {
      console.error('Send failed:', err.message);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [value, sending, channelId, onSend]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleInput(e) {
    setValue(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  return (
    <div className="message-input-bar">
      <div className="message-input-inner">
        <textarea
          ref={textareaRef}
          className="message-input-textarea"
          placeholder={`Message ${channelName}`}
          value={value}
          onInput={handleInput}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          rows={1}
          maxLength={2000}
        />
        <button
          className="send-btn"
          onClick={submit}
          disabled={!value.trim() || sending}
          title="Send message"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
      <div className="input-footer">
        <span className="char-count" style={{ opacity: value.length > 1800 ? 1 : 0 }}>
          {2000 - value.length}
        </span>
      </div>
    </div>
  );
}
