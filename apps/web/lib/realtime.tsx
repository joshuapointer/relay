'use client';

import { useAuth } from '@clerk/nextjs';
import { createRelayRealtime } from '@relay/sdk';
import type { RelayRealtime } from '@relay/sdk';
import type { ShipmentUpdatedPayload } from '@relay/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  const { getToken } = useAuth();
  const realtimeRef = useRef<RelayRealtime | null>(null);

  useEffect(() => {
    const rt = createRelayRealtime({
      url: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
      getAuthToken: () => getToken(),
    });

    realtimeRef.current = rt;

    // Connect — ignore connection errors in dev (API may not be running)
    rt.connect().catch(() => {
      // Graceful degradation: polling fallback via refetchInterval on queries
    });

    return () => {
      rt.disconnect();
      realtimeRef.current = null;
    };
    // getToken identity is stable from Clerk; realtimeRef is a ref (intentional empty deps)
  }, []);

  return (
    <RealtimeContext.Provider value={realtimeRef.current}>
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
    if (rt === null || !rt.isConnected()) return;

    rt.subscribe(shipmentId);
    // The handler receives the updated shipment payload but we only need to
    // invalidate — wrap to satisfy the exact callback signature.
    const handler = (_payload: ShipmentUpdatedPayload) => {
      invalidate();
    };
    rt.on('shipment:updated', handler);

    return () => {
      rt.off('shipment:updated', handler);
      rt.unsubscribe(shipmentId);
    };
  }, [rt, shipmentId, invalidate]);
}
