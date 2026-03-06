import { useEffect, useRef, useCallback } from 'react';

/**
 * Manages a single persistent WebSocket connection to /ws.
 *
 * @param {(event: object) => void} onMessage – called for every incoming JSON event
 * @returns {{ send: (payload: object) => void }}
 */
export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}/ws`;

    let ws;
    let reconnectTimer;

    function connect() {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        console.debug('[WS] connected');
      });

      ws.addEventListener('message', (e) => {
        try {
          const payload = JSON.parse(e.data);
          onMessageRef.current(payload);
        } catch {
          // ignore malformed frames
        }
      });

      ws.addEventListener('close', () => {
        console.debug('[WS] disconnected – reconnecting in 3s');
        reconnectTimer = setTimeout(connect, 3000);
      });

      ws.addEventListener('error', () => {
        ws.close();
      });
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const send = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  return { send };
}
