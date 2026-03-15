import { io } from 'socket.io-client';

// In development, the Vite dev server proxies API requests, but for WebSockets
// we connect to the same host/port.
export const socket = io(window.location.origin, {
  autoConnect: true,
});
