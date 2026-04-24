/**
 * lib/realtime.ts — Socket.IO wrapper via SDK createRelayRealtime.
 *
 * useShipmentSubscription(id) connects to the realtime namespace and
 * invalidates TanStack Query cache entries when an update arrives for the
 * given shipment.
 */
import { createRelayRealtime, type RelayRealtime } from '@relay/sdk';
import type { ServerToClientEvents } from '@relay/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Realtime singleton (lazily created)
// ---------------------------------------------------------------------------

const rtUrl: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000';

let _realtime: RelayRealtime | null = null;

function getRealtime(): RelayRealtime {
  if (_realtime === null) {
    _realtime = createRelayRealtime({
      url: rtUrl,
      getAuthToken: async () => {
        if (
          Constants.expoConfig?.extra?.CLERK_MOCK_MODE === true ||
          process.env.CLERK_MOCK_MODE === 'true'
        ) {
          return 'mock-auth-token';
        }
        return null;
      },
    });
  }
  return _realtime;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribes to real-time updates for a shipment.
 * On any shipment:updated event matching `id`, invalidates both the detail
 * query and the list query so TanStack Query refetches automatically.
 */
export function useShipmentSubscription(id: string | undefined): void {
  const queryClient = useQueryClient();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (id == null) return;

    const rt = getRealtime();

    const handler: ServerToClientEvents['shipment:updated'] = (payload) => {
      if (payload.id === id) {
        void queryClient.invalidateQueries({ queryKey: ['shipment', id] });
        void queryClient.invalidateQueries({ queryKey: ['shipments'] });
      }
    };

    let mounted = true;

    async function connect() {
      if (!connectedRef.current) {
        try {
          await rt.connect();
          connectedRef.current = true;
        } catch {
          // Graceful degradation: real-time unavailable, polling will cover it
          return;
        }
      }
      if (!mounted) return;
      rt.subscribe(id!);
      rt.on('shipment:updated', handler);
    }

    void connect();

    return () => {
      mounted = false;
      if (connectedRef.current) {
        try {
          rt.off('shipment:updated', handler);
          rt.unsubscribe(id);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [id, queryClient]);
}
