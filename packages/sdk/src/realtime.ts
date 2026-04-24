import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from '@relay/shared-types';

export interface RelayRealtimeOptions {
  url: string;
  getAuthToken: () => Promise<string | null>;
}

type RelaySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface RelayRealtime {
  subscribe(shipmentId: string): void;
  unsubscribe(shipmentId: string): void;
  on<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K],
  ): void;
  off<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K],
  ): void;
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
}

export function createRelayRealtime(options: RelayRealtimeOptions): RelayRealtime {
  const { url, getAuthToken } = options;

  let socket: RelaySocket | null = null;

  function getSocket(): RelaySocket {
    if (socket === null) {
      throw new Error('RelayRealtime: not connected. Call connect() first.');
    }
    return socket;
  }

  return {
    async connect() {
      const token = await getAuthToken();

      socket = io(`${url}/rt`, {
        transports: ['websocket'],
        auth: token !== null ? { token } : {},
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: Infinity,
      }) as RelaySocket;

      return new Promise<void>((resolve, reject) => {
        const s = socket!;
        s.once('connect', () => { resolve(); });
        s.once('connect_error', (err) => { reject(err); });
      });
    },

    disconnect() {
      if (socket !== null) {
        socket.disconnect();
        socket = null;
      }
    },

    isConnected() {
      return socket?.connected ?? false;
    },

    subscribe(shipmentId) {
      getSocket().emit('shipment:subscribe', { shipmentId });
    },

    unsubscribe(shipmentId) {
      getSocket().emit('shipment:unsubscribe', { shipmentId });
    },

    on<K extends keyof ServerToClientEvents>(event: K, callback: ServerToClientEvents[K]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getSocket().on(event as any, callback as any);
    },

    off<K extends keyof ServerToClientEvents>(event: K, callback: ServerToClientEvents[K]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getSocket().off(event as any, callback as any);
    },
  };
}
