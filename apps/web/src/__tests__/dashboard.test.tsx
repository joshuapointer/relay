/**
 * Dashboard page tests — uses MSW to mock SDK fetches.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ getToken: async () => 'test-token' }),
  UserButton: () => <button type="button">User</button>,
}));

vi.mock('@relay/ui-core', () => ({
  StatusPill: ({ status }: { status: string }) => (
    <span role="status" aria-label={status}>{status}</span>
  ),
}));

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const BASE = 'http://localhost:3001';

const handlers = {
  empty: http.get(`${BASE}/v1/shipments`, () =>
    HttpResponse.json({ items: [], cursor: undefined }),
  ),
  list: http.get(`${BASE}/v1/shipments`, () =>
    HttpResponse.json({
      items: [
        {
          id: 'shp-1',
          userId: 'usr-1',
          carrier: { code: 'USPS', displayName: 'USPS' },
          trackingNumber: '9400111899223397',
          nickname: 'Birthday gift',
          status: 'In Transit',
          lastEventAt: '2026-04-20T10:00:00.000Z',
          eta: null,
          createdAt: '2026-04-19T09:00:00.000Z',
          updatedAt: '2026-04-20T10:00:00.000Z',
        },
        {
          id: 'shp-2',
          userId: 'usr-1',
          carrier: { code: 'UPS', displayName: 'UPS' },
          trackingNumber: '1Z999AA10123456784',
          nickname: undefined,
          status: 'Delivered',
          lastEventAt: '2026-04-21T14:00:00.000Z',
          eta: null,
          createdAt: '2026-04-18T08:00:00.000Z',
          updatedAt: '2026-04-21T14:00:00.000Z',
        },
        {
          id: 'shp-3',
          userId: 'usr-1',
          carrier: { code: 'FEDEX', displayName: 'FedEx' },
          trackingNumber: '449044304137821',
          nickname: 'Work laptop',
          status: 'Pending',
          lastEventAt: null,
          eta: null,
          createdAt: '2026-04-22T07:00:00.000Z',
          updatedAt: '2026-04-22T07:00:00.000Z',
        },
      ],
    }),
  ),
  error: http.get(`${BASE}/v1/shipments`, () =>
    HttpResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 }),
  ),
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

async function renderDashboard() {
  const { default: DashboardPage } = await import('../../app/(app)/dashboard/page');
  const Wrapper = makeWrapper();
  return render(<DashboardPage />, { wrapper: Wrapper });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DashboardPage', () => {
  it('shows empty state when no shipments', async () => {
    server.use(handlers.empty);
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/no shipments yet/i)).toBeDefined();
    });
    expect(screen.getByText(/track your first package/i)).toBeDefined();
  });

  it('shows Add tracking CTA in empty state', async () => {
    server.use(handlers.empty);
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/add tracking/i)).toBeDefined();
    });
  });

  it('shows loading skeletons while pending', async () => {
    // Delay response so we catch the loading state
    server.use(
      http.get(`${BASE}/v1/shipments`, async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json({ items: [] });
      }),
    );
    await renderDashboard();
    // Skeletons have aria-busy=true
    const skeletons = screen.getAllByRole('status', { hidden: false });
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders 3 shipment cards when list returns 3 items', async () => {
    server.use(handlers.list);
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Birthday gift')).toBeDefined();
    });
    expect(screen.getByText('Work laptop')).toBeDefined();
    // Tracking number shown for shipment without nickname (appears in both title and subtitle)
    expect(screen.getAllByText('1Z999AA10123456784').length).toBeGreaterThan(0);
  });

  it('shows error state on fetch failure with retry button', async () => {
    server.use(handlers.error);
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
    expect(screen.getByRole('button', { name: /try again/i })).toBeDefined();
  });

  it('renders the Shipments heading', async () => {
    server.use(handlers.empty);
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /shipments/i })).toBeDefined();
    });
  });

  it('renders tab filters', async () => {
    server.use(handlers.empty);
    await renderDashboard();
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /all/i })).toBeDefined();
    });
    expect(screen.getByRole('tab', { name: /in transit/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /delivered/i })).toBeDefined();
  });
});
