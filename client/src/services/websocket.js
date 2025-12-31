const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

let ws = null;
const listeners = {};

export function connectWebSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (listeners[message.type]) {
          listeners[message.type].forEach((callback) => callback(message.payload));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected. Attempting to reconnect...');
      ws = null;
      setTimeout(connectWebSocket, 3000);
    };
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
    setTimeout(connectWebSocket, 3000);
  }
}

export function subscribeToUpdates(type, callback) {
  if (!listeners[type]) {
    listeners[type] = [];
  }
  listeners[type].push(callback);

  return () => {
    const index = listeners[type].indexOf(callback);
    if (index > -1) {
      listeners[type].splice(index, 1);
    }
  };
}

export function disconnectWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
  }
}
