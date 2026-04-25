import type { PrismaClient } from '@prisma/client';

import type {
  InternalShipmentStatus,
  DisplayShipmentStatus,
} from '../schemas/status.js';
import { toDisplay } from '../schemas/status.js';

import {
  type EasyPostAdapter,
  type NormalizedTracker,
  AdapterError,
  AdapterCircuitOpenError,
} from './easypost/adapter.js';

export interface CreateShipmentInput {
  trackingNumber: string;
  carrierCode?: string | undefined;
  nickname?: string | undefined;
}

export interface UpdateShipmentInput {
  nickname?: string | undefined;
}

export interface ShipmentListOptions {
  status?: DisplayShipmentStatus | undefined;
}

export class ShipmentError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
  }
}

/**
 * Ensures a Carrier row exists for the given code. Auto-creates with
 * sensible defaults — avoids the need for a migration-time seed.
 */
async function ensureCarrier(
  prisma: PrismaClient,
  code: string
): Promise<{ id: string; code: string; displayName: string }> {
  const upper = code.toUpperCase();
  const existing = await prisma.carrier.findUnique({ where: { code: upper } });
  if (existing) {
    return { id: existing.id, code: existing.code, displayName: existing.displayName };
  }
  const created = await prisma.carrier.create({
    data: {
      id: upper,
      code: upper,
      name: upper,
      displayName: displayForCarrier(upper),
    },
  });
  return { id: created.id, code: created.code, displayName: created.displayName };
}

function displayForCarrier(code: string): string {
  const map: Record<string, string> = {
    USPS: 'USPS',
    UPS: 'UPS',
    FEDEX: 'FedEx',
    DHL: 'DHL',
    DHLEXPRESS: 'DHL Express',
    ONTRAC: 'OnTrac',
    LASERSHIP: 'LaserShip',
  };
  return map[code] ?? code;
}

export interface ShipmentDTO {
  id: string;
  userId: string;
  carrier: { code: string; displayName: string };
  trackingNumber: string;
  nickname?: string;
  status: DisplayShipmentStatus;
  lastEventAt: string | null;
  eta: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEventDTO {
  id: string;
  shipmentId: string;
  occurredAt: string;
  status: DisplayShipmentStatus;
  description: string;
  location: string | null;
}

export interface ShipmentDetailDTO extends ShipmentDTO {
  events: TrackingEventDTO[];
}

type ShipmentRow = {
  id: string;
  userId: string;
  carrierId: string;
  trackingNumber: string;
  nickname: string | null;
  status: InternalShipmentStatus;
  lastEventAt: Date | null;
  eta: Date | null;
  createdAt: Date;
  updatedAt: Date;
  carrier?: { code: string; displayName: string } | null;
  events?: Array<{
    id: string;
    shipmentId: string;
    occurredAt: Date;
    status: InternalShipmentStatus;
    description: string;
    location: string | null;
  }>;
};

function toShipmentDTO(row: ShipmentRow): ShipmentDTO {
  return {
    id: row.id,
    userId: row.userId,
    carrier: {
      code: row.carrier?.code ?? row.carrierId,
      displayName: row.carrier?.displayName ?? row.carrierId,
    },
    trackingNumber: row.trackingNumber,
    ...(row.nickname ? { nickname: row.nickname } : {}),
    status: toDisplay(row.status),
    lastEventAt: row.lastEventAt ? row.lastEventAt.toISOString() : null,
    eta: row.eta ? row.eta.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toEventDTO(e: NonNullable<ShipmentRow['events']>[number]): TrackingEventDTO {
  return {
    id: e.id,
    shipmentId: e.shipmentId,
    occurredAt: e.occurredAt.toISOString(),
    status: toDisplay(e.status),
    description: e.description,
    location: e.location ?? null,
  };
}

function toShipmentDetailDTO(row: ShipmentRow): ShipmentDetailDTO {
  return {
    ...toShipmentDTO(row),
    events: (row.events ?? []).map(toEventDTO),
  };
}

const DISPLAY_TO_INTERNALS: Record<DisplayShipmentStatus, InternalShipmentStatus[]> = {
  Pending: ['PENDING'],
  'In Transit': ['IN_TRANSIT'],
  'Out for Delivery': ['OUT_FOR_DELIVERY'],
  Delivered: ['DELIVERED'],
  Exception: ['EXCEPTION', 'RETURNED', 'UNKNOWN'],
};

export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly adapter: EasyPostAdapter
  ) {}

  async createShipment(input: CreateShipmentInput, userId: string): Promise<ShipmentDetailDTO> {
    let tracker: NormalizedTracker;
    try {
      tracker = await this.adapter.createTracker({
        trackingCode: input.trackingNumber,
        ...(input.carrierCode ? { carrierCode: input.carrierCode } : {}),
      });
    } catch (err) {
      if (err instanceof AdapterCircuitOpenError) {
        throw new ShipmentError(
          'Carrier service temporarily unavailable',
          503,
          'UPSTREAM_UNAVAILABLE'
        );
      }
      if (err instanceof AdapterError && err.code === 'CARRIER_NOT_FOUND') {
        throw new ShipmentError('Carrier not found', 400, 'CARRIER_NOT_FOUND');
      }
      throw new ShipmentError(
        (err as Error).message ?? 'Carrier error',
        502,
        'UPSTREAM_ERROR'
      );
    }

    const inputCarrier = input.carrierCode?.trim();
    const carrierCode = inputCarrier && inputCarrier.length > 0
      ? inputCarrier.toUpperCase()
      : tracker.carrierCode;
    const carrier = await ensureCarrier(this.prisma, carrierCode);

    const existing = await this.prisma.shipment.findUnique({
      where: {
        trackingNumber_carrierId: {
          trackingNumber: input.trackingNumber,
          carrierId: carrier.id,
        },
      },
    });
    if (existing && existing.userId === userId) {
      // re-use existing shipment for the same user, refresh events
      return this.refreshShipment(existing.id, userId);
    }
    if (existing && existing.userId !== userId) {
      throw new ShipmentError(
        'Shipment with this tracking number already exists',
        409,
        'CONFLICT'
      );
    }

    const created = (await this.prisma.shipment.create({
      data: {
        userId,
        carrierId: carrier.id,
        trackingNumber: input.trackingNumber,
        nickname: input.nickname ?? null,
        status: tracker.status,
        lastEventAt: tracker.lastEventAt,
        eta: tracker.eta,
      },
      include: { carrier: true },
    })) as unknown as ShipmentRow;

    if (tracker.events.length) {
      for (const evt of tracker.events) {
        await this.prisma.trackingEvent.create({
          data: {
            shipmentId: created.id,
            occurredAt: evt.occurredAt,
            status: evt.status,
            description: evt.description,
            location: evt.location,
            rawEvent: evt.raw as object,
          },
        });
      }
    }

    return this.getShipment(created.id, userId);
  }

  async listShipments(
    userId: string,
    opts: ShipmentListOptions = {}
  ): Promise<{ items: ShipmentDTO[] }> {
    const where: Record<string, unknown> = { userId };
    if (opts.status) {
      const internals = DISPLAY_TO_INTERNALS[opts.status];
      // fall back to single-value filter since mock doesn't support {in:}
      where['status'] = internals[0];
    }
    const rows = (await this.prisma.shipment.findMany({
      where,
      include: { carrier: true },
      orderBy: { createdAt: 'desc' },
    })) as unknown as ShipmentRow[];
    return { items: rows.map((r) => toShipmentDTO(r)) };
  }

  async getShipment(id: string, userId: string): Promise<ShipmentDetailDTO> {
    const row = (await this.prisma.shipment.findUnique({
      where: { id },
      include: { carrier: true, events: true },
    })) as ShipmentRow | null;
    if (!row) throw new ShipmentError('Shipment not found', 404, 'NOT_FOUND');
    if (row.userId !== userId) {
      throw new ShipmentError('Forbidden', 403, 'FORBIDDEN');
    }
    return toShipmentDetailDTO(row);
  }

  async updateShipment(
    id: string,
    userId: string,
    patch: UpdateShipmentInput
  ): Promise<ShipmentDetailDTO> {
    await this.getShipment(id, userId); // ownership check
    await this.prisma.shipment.update({
      where: { id },
      data: {
        ...(patch.nickname !== undefined ? { nickname: patch.nickname } : {}),
      },
    });
    return this.getShipment(id, userId);
  }

  async deleteShipment(id: string, userId: string): Promise<void> {
    await this.getShipment(id, userId);
    await this.prisma.shipment.delete({ where: { id } });
  }

  async refreshShipment(id: string, userId: string): Promise<ShipmentDetailDTO> {
    const existing = await this.getShipment(id, userId);
    // we don't currently persist providerTrackerId; fetch fresh via trackingNumber
    let tracker: NormalizedTracker;
    try {
      tracker = await this.adapter.createTracker({
        trackingCode: existing.trackingNumber,
        carrierCode: existing.carrier.code,
      });
    } catch (err) {
      if (err instanceof AdapterCircuitOpenError) {
        throw new ShipmentError(
          'Carrier service temporarily unavailable',
          503,
          'UPSTREAM_UNAVAILABLE'
        );
      }
      throw new ShipmentError(
        (err as Error).message ?? 'Carrier error',
        502,
        'UPSTREAM_ERROR'
      );
    }
    await this.prisma.shipment.update({
      where: { id },
      data: {
        status: tracker.status,
        lastEventAt: tracker.lastEventAt,
        eta: tracker.eta,
      },
    });
    for (const evt of tracker.events) {
      await this.prisma.trackingEvent.create({
        data: {
          shipmentId: id,
          occurredAt: evt.occurredAt,
          status: evt.status,
          description: evt.description,
          location: evt.location,
          rawEvent: evt.raw as object,
        },
      });
    }
    return this.getShipment(id, userId);
  }
}
