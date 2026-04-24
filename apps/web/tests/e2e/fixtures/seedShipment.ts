/**
 * seedShipment — MSW-based fixture helper for Playwright E2E tests.
 *
 * In a full integration environment this would intercept SDK/API calls via
 * MSW service worker. In sandbox / CI environments where the dev server is
 * not running, the parent spec files guard with a skip so this helper is
 * never invoked.
 *
 * Usage in beforeEach:
 *   await seedShipment(page, FIXTURE_SHIPMENT);
 *
 * The helper navigates to a stub URL that accepts an MSW-seeded route via
 * the CLERK_MOCK_MODE=true environment flag so Clerk bypasses real auth.
 */

import type { Page } from '@playwright/test';

export interface ShipmentFixture {
  id: string;
  trackingNumber: string;
  status: 'Pending' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Exception';
  carrier: { code: string; displayName: string };
  nickname?: string;
  eta?: string;
  events: Array<{
    id: string;
    shipmentId: string;
    occurredAt: string;
    status: string;
    description: string;
    location?: string;
  }>;
}

export const FIXTURE_SHIPMENT: ShipmentFixture = {
  id: 'fixture-1',
  trackingNumber: '9400111899223409376213',
  status: 'In Transit',
  carrier: { code: 'USPS', displayName: 'USPS' },
  nickname: 'Test Package',
  eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  events: [
    {
      id: 'evt-1',
      shipmentId: 'fixture-1',
      occurredAt: new Date().toISOString(),
      status: 'In Transit',
      description: 'Package is in transit to destination',
      location: 'Memphis, TN',
    },
    {
      id: 'evt-2',
      shipmentId: 'fixture-1',
      occurredAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'Pending',
      description: 'Shipment accepted at origin facility',
      location: 'Austin, TX',
    },
  ],
};

/**
 * Pre-seeds a fake shipment into the page context by intercepting the API
 * route via Playwright's route interception (no MSW service worker needed).
 *
 * Intercepts:
 *   GET /api/shipments/fixture-1  → returns FIXTURE_SHIPMENT JSON
 *   GET /api/shipments            → returns [FIXTURE_SHIPMENT] JSON
 */
export async function seedShipment(
  page: Page,
  fixture: ShipmentFixture = FIXTURE_SHIPMENT,
): Promise<void> {
  // Intercept the individual shipment fetch
  await page.route(`**/api/shipments/${fixture.id}`, (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture),
    });
  });

  // Intercept the shipments list fetch
  await page.route('**/api/shipments', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([fixture]),
    });
  });
}
