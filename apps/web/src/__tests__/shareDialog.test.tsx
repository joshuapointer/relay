/**
 * ShareDialog tests — mocks the SDK via MSW.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      accessToken: 'test-token',
      user: { name: 'Test User', email: 'test@relay.dev' },
    },
    status: 'authenticated',
  }),
}));

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const BASE = 'http://localhost:3001';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

async function renderShareDialog(isOpen = true) {
  const { ShareDialog } = await import('../../components/ShareDialog');
  const Wrapper = makeWrapper();
  const onClose = vi.fn();
  render(
    <ShareDialog shipmentId="shp-1" isOpen={isOpen} onClose={onClose} />,
    { wrapper: Wrapper },
  );
  return { onClose };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ShareDialog', () => {
  it('renders the dialog title when open', async () => {
    await renderShareDialog();
    expect(screen.getByText(/share tracking link/i)).toBeDefined();
  });

  it('renders TTL select with default 7 days', async () => {
    await renderShareDialog();
    const select = screen.getByLabelText(/link expires after/i);
    expect((select as HTMLSelectElement).value).toBe('7');
  });

  it('calls create link API and shows URL on success', async () => {
    server.use(
      http.post(`${BASE}/v1/shipments/shp-1/share`, () =>
        HttpResponse.json({
          token: 'abc123',
          expiresAt: '2026-05-22T00:00:00.000Z',
          url: 'https://relay.app/share/abc123',
        }),
      ),
    );

    await renderShareDialog();
    await userEvent.click(screen.getByRole('button', { name: /create link/i }));

    await waitFor(() => {
      expect(screen.getByText('https://relay.app/share/abc123')).toBeDefined();
    });
    expect(screen.getByRole('button', { name: /copy/i })).toBeDefined();
  });

  it('shows 429 rate-limit error message', async () => {
    server.use(
      http.post(`${BASE}/v1/shipments/shp-1/share`, () =>
        HttpResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'Rate limited' } },
          { status: 429 },
        ),
      ),
    );

    await renderShareDialog();
    await userEvent.click(screen.getByRole('button', { name: /create link/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
    expect(screen.getByText(/too many share links today/i)).toBeDefined();
  });

  it('calls onClose when cancel is clicked', async () => {
    const { onClose } = await renderShareDialog();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
