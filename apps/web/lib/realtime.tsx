'use client';

import { createRelayRealtime } from '@relay/sdk';
import type { RelayRealtime } from '@relay/sdk';
import type { ShipmentUpdatedPayload } from '@relay/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const RealtimeContext = createContext<RelayRealtime | null>(null);

export interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? null;
  const [rt, setRt] = useState<RelayRealtime | null>(null);

  useEffect(() => {
    const instance = createRelayRealtime({
      url: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
      getAuthToken: async () => token,
    });

    let cancelled = false;

    instance.connect().then(() => {
      if (!cancelled) setRt(instance);
    }).catch(() => {
      // Graceful degradation: polling fallback via refetchInterval on queries
    });

    return () => {
      cancelled = true;
      instance.disconnect();
      setRt(null);
    };
  }, [token]);

  return (
    <RealtimeContext.Provider value={rt}>
      {children}
    </RealtimeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook: subscribe to a single shipment and invalidate on updates
// ---------------------------------------------------------------------------

export function useShipmentSubscription(shipmentId: string) {
  const rt = useContext(RealtimeContext);
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['shipment', shipmentId] });
    void queryClient.invalidateQueries({ queryKey: ['shipments'] });
  }, [queryClient, shipmentId]);

  useEffect(() => {
    if (rt === null) return;

    const handler = (_payload: ShipmentUpdatedPayload) => {
      invalidate();
    };

    rt.subscribe(shipmentId);
    rt.on('shipment:updated', handler);

    return () => {
      rt.off('shipment:updated', handler);
      rt.unsubscribe(shipmentId);
    };
  }, [rt, shipmentId, invalidate]);
}
