import type { FastifyInstance } from 'fastify';

import type { ShipmentDTO, ShipmentDetailDTO } from '../services/shipments.js';

/**
 * Broadcasts a shipment update to the user's Socket.IO room. Silently no-ops
 * if the IO server was never attached (e.g. in unit tests that don't need
 * realtime).
 */
export async function broadcastShipmentUpdate(
  app: FastifyInstance,
  userId: string,
  shipment: ShipmentDTO | ShipmentDetailDTO
): Promise<void> {
  const io = app.io;
  if (!io) return;
  const nsp = io.of('/rt');
  // strip events for base payload
  const { events: _events, ...base } = shipment as ShipmentDetailDTO;
  void _events;
  nsp.to(`user:${userId}`).emit('shipment:updated', base);
  nsp.to(`shipment:${shipment.id}`).emit('shipment:updated', base);

  if (shipment.status === 'Delivered') {
    nsp.to(`user:${userId}`).emit('shipment:delivered', base);
  } else if (shipment.status === 'Exception') {
    nsp.to(`user:${userId}`).emit('shipment:exception', base);
  }
}
