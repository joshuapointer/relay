/**
 * Socket.IO client factory — stubbed for WS-C-02 wiring.
 * Accepts API URL from env, configures auto-reconnect with exponential backoff.
 */
import { io, type Socket } from 'socket.io-client';

let _socket: Socket | null = null;

export interface SocketClientOptions {
  url: string;
  /** Clerk JWT for handshake auth */
  token?: string;
}

/**
 * Returns a singleton Socket.IO client connected to the /rt namespace.
 * Call connect() to initiate the connection; disconnect() to tear down.
 */
export function getSocketClient({ url, token }: SocketClientOptions): Socket {
  if (_socket) {
    return _socket;
  }

  _socket = io(`${url}/rt`, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30_000,
    randomizationFactor: 0.5,
    ...(token ? { auth: { token } } : {}),
    transports: ['websocket'],
  });

  return _socket;
}

/**
 * Tears down the singleton client. Call when user signs out.
 */
export function disconnectSocketClient(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
