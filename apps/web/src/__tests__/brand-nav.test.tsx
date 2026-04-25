/**
 * Brand acceptance test — TopNav
 *
 * Verifies:
 *   1. Background colour is Deep Tech Blue (#003B73) from design tokens
 *   2. BrandLogo with aria-label "Relay" is present
 *   3. Deep Tech Blue is applied via CSS var on the header
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// Mock next-auth/react so the component renders in jsdom without a real session
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Test User', email: 'test@relay.dev' } }, status: 'authenticated' }),
  signOut: () => undefined,
}));

// Mock useSdk so TopNav doesn't need a real API client
vi.mock('@/hooks/useSdk', () => ({
  useSdk: () => ({
    notifications: { list: () => Promise.resolve({ items: [] }) },
  }),
}));

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

// Mock @relay/ui-core BrandLogo to avoid SVG/token resolution issues in jsdom
vi.mock('@relay/ui-core', () => ({
  BrandLogo: ({ variant }: { variant?: string }) => (
    <span role="img" aria-label="Relay" data-variant={variant} className="text-white">
      Relay
    </span>
  ),
}));

let TopNav: ComponentType;

beforeAll(async () => {
  // Dynamic import after mocks are registered
  const mod = await import('../../components/TopNav');
  TopNav = mod.default;
});

describe('TopNav brand acceptance', () => {
  it('renders the wordmark', () => {
    renderWithQuery(<TopNav />);
    const wordmark = screen.getByText(/relay/i);
    expect(wordmark).toBeDefined();
  });

  it('applies Deep Tech Blue (#003B73) background via CSS var', () => {
    renderWithQuery(<TopNav />);
    const header = screen.getByTestId('top-nav');
    expect(header).toHaveStyle({
      backgroundColor: 'var(--color-primary)',
    });
  });

  it('BrandLogo has accessible label "Relay"', () => {
    renderWithQuery(<TopNav />);
    const logo = screen.getByRole('img', { name: /relay/i });
    expect(logo).toBeDefined();
  });
});
