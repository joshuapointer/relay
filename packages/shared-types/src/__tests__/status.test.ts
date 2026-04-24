import { describe, it, expect } from 'vitest';
import {
  InternalShipmentStatusSchema,
  DisplayShipmentStatusSchema,
  toDisplay,
} from '../status.js';
import type { InternalShipmentStatus, DisplayShipmentStatus } from '../status.js';

describe('InternalShipmentStatusSchema', () => {
  it('accepts all 7 valid internal values', () => {
    const values: InternalShipmentStatus[] = [
      'PENDING',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'EXCEPTION',
      'RETURNED',
      'UNKNOWN',
    ];
    for (const v of values) {
      expect(() => InternalShipmentStatusSchema.parse(v)).not.toThrow();
    }
  });

  it('rejects invalid values', () => {
    expect(() => InternalShipmentStatusSchema.parse('LOST')).toThrow();
    expect(() => InternalShipmentStatusSchema.parse('')).toThrow();
    expect(() => InternalShipmentStatusSchema.parse(null)).toThrow();
  });
});

describe('DisplayShipmentStatusSchema', () => {
  it('accepts all 5 valid display values', () => {
    const values: DisplayShipmentStatus[] = [
      'Pending',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Exception',
    ];
    for (const v of values) {
      expect(() => DisplayShipmentStatusSchema.parse(v)).not.toThrow();
    }
  });

  it('rejects PENDING (wrong case)', () => {
    expect(() => DisplayShipmentStatusSchema.parse('PENDING')).toThrow();
  });
});

describe('toDisplay', () => {
  it('maps PENDING → Pending', () => {
    expect(toDisplay('PENDING')).toBe('Pending');
  });

  it('maps IN_TRANSIT → In Transit', () => {
    expect(toDisplay('IN_TRANSIT')).toBe('In Transit');
  });

  it('maps OUT_FOR_DELIVERY → Out for Delivery', () => {
    expect(toDisplay('OUT_FOR_DELIVERY')).toBe('Out for Delivery');
  });

  it('maps DELIVERED → Delivered', () => {
    expect(toDisplay('DELIVERED')).toBe('Delivered');
  });

  it('maps EXCEPTION → Exception', () => {
    expect(toDisplay('EXCEPTION')).toBe('Exception');
  });

  it('maps RETURNED → Exception (fallback)', () => {
    expect(toDisplay('RETURNED')).toBe('Exception');
  });

  it('maps UNKNOWN → Exception (fallback)', () => {
    expect(toDisplay('UNKNOWN')).toBe('Exception');
  });
});
