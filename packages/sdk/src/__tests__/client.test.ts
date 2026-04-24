import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createRelayClient } from '../client.js';
import { RelayAuthError, RelayClientError, RelayValidationError } from '../errors.js';

const BASE_URL = 'https://api.relay.test';

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

const validShipmentDetail = {
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
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient(token: string | null = 'test-token') {
  return createRelayClient({
    baseUrl: BASE_URL,
    getAuthToken: async () => token,
  });
}

describe('shipments.list', () => {
  it('parses a successful list response', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/shipments`, () =>
        HttpResponse.json({ items: [validShipment], cursor: 'next_cursor' }),
      ),
    );

    const client = makeClient();
    const result = await client.shipments.list();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('cld_abc123');
    expect(result.cursor).toBe('next_cursor');
  });

  it('parses empty list', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/shipments`, () =>
        HttpResponse.json({ items: [] }),
      ),
    );

    const client = makeClient();
    const result = await client.shipments.list();
    expect(result.items).toHaveLength(0);
  });

  it('throws RelayAuthError on 401', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/shipments`, () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
          { status: 401 },
        ),
      ),
    );

    const client = makeClient();
    await expect(client.shipments.list()).rejects.toThrow(RelayAuthError);
  });

  it('throws RelayClientError on 400 with fieldErrors', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/shipments`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query params',
              fieldErrors: { status: ['Invalid enum value'] },
            },
          },
          { status: 400 },
        ),
      ),
    );

    const client = makeClient();
    const err = await client.shipments.list().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RelayClientError);
    const relayErr = err as RelayClientError;
    expect(relayErr.status).toBe(400);
    expect(relayErr.apiError.fieldErrors?.['status']).toEqual(['Invalid enum value']);
  });

  it('throws RelayValidationError on invalid schema payload', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/shipments`, () =>
        // items has wrong status value
        HttpResponse.json({
          items: [{ ...validShipment, status: 'INVALID_STATUS' }],
        }),
      ),
    );

    const client = makeClient();
    await expect(client.shipments.list()).rejects.toThrow(RelayValidationError);
  });
});

describe('shipments.get', () => {
  it('parses a shipment detail', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/shipments/cld_abc123`, () =>
        HttpResponse.json(validShipmentDetail),
      ),
    );

    const client = makeClient();
    const result = await client.shipments.get('cld_abc123');
    expect(result.id).toBe('cld_abc123');
    expect(result.events).toHaveLength(1);
  });
});

describe('shipments.create', () => {
  it('creates a shipment', async () => {
    server.use(
      http.post(`${BASE_URL}/v1/shipments`, () =>
        HttpResponse.json(validShipment, { status: 201 }),
      ),
    );

    const client = makeClient();
    const result = await client.shipments.create({
      trackingNumber: '9400111899223397658538',
      carrierCode: 'usps',
    });
    expect(result.id).toBe('cld_abc123');
  });
});

describe('share link flow', () => {
  it('creates a share link', async () => {
    server.use(
      http.post(`${BASE_URL}/v1/shipments/cld_abc123/share`, () =>
        HttpResponse.json({
          token: 'share_tok_abc',
          expiresAt: '2026-04-29T00:00:00.000Z',
          url: 'https://relay.app/share/share_tok_abc',
        }),
      ),
    );

    const client = makeClient();
    const result = await client.shipments.createShareLink('cld_abc123', { ttlDays: 7 });
    expect(result.token).toBe('share_tok_abc');
    expect(result.url).toContain('share_tok_abc');
  });

  it('fetches a public shipment view (no auth)', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/share/share_tok_abc`, () =>
        HttpResponse.json({
          carrier: { code: 'usps', displayName: 'USPS' },
          trackingNumber: '9400111899223397658538',
          status: 'In Transit',
          eta: '2026-04-23T20:00:00.000Z',
          recentEvents: [],
        }),
      ),
    );

    const client = makeClient();
    const result = await client.share.get('share_tok_abc');
    expect(result.trackingNumber).toBe('9400111899223397658538');
    expect(result.status).toBe('In Transit');
  });
});

describe('notifications.list', () => {
  it('returns notification list', async () => {
    server.use(
      http.get(`${BASE_URL}/v1/notifications`, () =>
        HttpResponse.json({
          items: [
            {
              id: 'notif_1',
              userId: 'user_xyz',
              shipmentId: 'cld_abc123',
              type: 'DELIVERED',
              title: 'Package Delivered',
              body: 'Your package has been delivered.',
              readAt: null,
              sentAt: '2026-04-20T12:00:00.000Z',
              createdAt: '2026-04-20T12:00:00.000Z',
            },
          ],
        }),
      ),
    );

    const client = makeClient();
    const result = await client.notifications.list();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe('DELIVERED');
  });
});
