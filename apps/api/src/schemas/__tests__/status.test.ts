import { describe, it, expect } from 'vitest';

import {
  toDisplay,
  InternalShipmentStatusSchema,
  DisplayShipmentStatusSchema,
} from '../status.js';

describe('toDisplay', () => {
  it('maps PENDING to Pending', () => {
    expect(toDisplay('PENDING')).toBe('Pending');
  });

  it('maps IN_TRANSIT to In Transit', () => {
    expect(toDisplay('IN_TRANSIT')).toBe('In Transit');
  });

  it('maps OUT_FOR_DELIVERY to Out for Delivery', () => {
    expect(toDisplay('OUT_FOR_DELIVERY')).toBe('Out for Delivery');
  });

  it('maps DELIVERED to Delivered', () => {
    expect(toDisplay('DELIVERED')).toBe('Delivered');
  });

  it('maps EXCEPTION to Exception', () => {
    expect(toDisplay('EXCEPTION')).toBe('Exception');
  });

  it('maps RETURNED to Exception', () => {
    expect(toDisplay('RETURNED')).toBe('Exception');
  });

  it('maps UNKNOWN to Exception', () => {
    expect(toDisplay('UNKNOWN')).toBe('Exception');
  });

  it('all 7 internal values produce valid display values', () => {
    const internals = InternalShipmentStatusSchema.options;
    expect(internals).toHaveLength(7);
    for (const status of internals) {
      const display = toDisplay(status);
      expect(() => DisplayShipmentStatusSchema.parse(display)).not.toThrow();
    }
  });

  it('maps RETURNED and UNKNOWN to Exception (5-value collapse)', () => {
    const displayValues = new Set(
      InternalShipmentStatusSchema.options.map(toDisplay)
    );
    expect(displayValues.size).toBe(5);
  });
});
