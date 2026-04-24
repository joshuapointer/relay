import { describe, it, expect } from 'vitest';
import {
  ShipmentSchema,
  ShipmentDetailSchema,
  CreateShipmentInputSchema,
  ShipmentListResponseSchema,
} from '../shipment.js';

const validShipment = {
  id: 'cld_abc123',
  userId: 'user_xyz',
  carrier: { code: 'usps', displayName: 'USPS' },
  trackingNumber: '9400111899223397658538',
  status: 'In Transit',
  lastEventAt: '2026-04-20T10:00:00.000Z',
  eta: '2026-04-23T20:00:00.000Z',
  createdAt: '2026-04-18T08:00:00.000Z',
  updatedAt: '2026-04-20T10:00:00.000Z',
};

describe('ShipmentSchema', () => {
  it('parses a valid shipment', () => {
    const result = ShipmentSchema.safeParse(validShipment);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('In Transit');
      expect(result.data.carrier.code).toBe('usps');
    }
  });

  it('parses shipment with optional nickname', () => {
    const result = ShipmentSchema.safeParse({ ...validShipment, nickname: 'My package' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nickname).toBe('My package');
    }
  });

  it('parses shipment with null lastEventAt and eta', () => {
    const result = ShipmentSchema.safeParse({
      ...validShipment,
      lastEventAt: null,
      eta: null,
    });
    expect(result.success).toBe(true);
  });

  it('fails on invalid display status', () => {
    const result = ShipmentSchema.safeParse({ ...validShipment, status: 'IN_TRANSIT' });
    expect(result.success).toBe(false);
  });

  it('fails when required fields are missing', () => {
    const { id: _omit, ...noId } = validShipment;
    const result = ShipmentSchema.safeParse(noId);
    expect(result.success).toBe(false);
  });

  it('fails on invalid datetime format', () => {
    const result = ShipmentSchema.safeParse({ ...validShipment, createdAt: 'not-a-date' });
    expect(result.success).toBe(false);
  });
});

describe('ShipmentDetailSchema', () => {
  it('parses a shipment with events array', () => {
    const result = ShipmentDetailSchema.safeParse({
      ...validShipment,
      events: [
        {
          id: 'evt_1',
          shipmentId: 'cld_abc123',
          occurredAt: '2026-04-20T10:00:00.000Z',
          status: 'In Transit',
          description: 'Package in transit',
          location: 'Chicago, IL',
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.events).toHaveLength(1);
    }
  });

  it('fails if events is missing', () => {
    const result = ShipmentDetailSchema.safeParse(validShipment);
    expect(result.success).toBe(false);
  });
});

describe('CreateShipmentInputSchema', () => {
  it('requires trackingNumber', () => {
    const result = CreateShipmentInputSchema.safeParse({ trackingNumber: '' });
    expect(result.success).toBe(false);
  });

  it('parses with just trackingNumber', () => {
    const result = CreateShipmentInputSchema.safeParse({
      trackingNumber: '9400111899223397658538',
    });
    expect(result.success).toBe(true);
  });
});

describe('ShipmentListResponseSchema', () => {
  it('parses empty list', () => {
    const result = ShipmentListResponseSchema.safeParse({ items: [] });
    expect(result.success).toBe(true);
  });

  it('parses list with cursor', () => {
    const result = ShipmentListResponseSchema.safeParse({
      items: [validShipment],
      cursor: 'next_page_token',
    });
    expect(result.success).toBe(true);
  });
});
