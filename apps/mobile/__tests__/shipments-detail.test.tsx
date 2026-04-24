/**
 * Shipments detail screen tests — render with mocked data, assert
 * StatusPill + timeline + ETA + share button.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

// ── Router mock ──────────────────────────────────────────────────────────────
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ id: 'ship-test-1' }),
}));

// ── SafeArea mock ────────────────────────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// ── Design tokens mock ───────────────────────────────────────────────────────
jest.mock('@relay/design-tokens/native', () => ({
  nativeTokens: {
    color: {
      primary: '#003b73',
      secondary: '#00c2cb',
      surface: '#ffffff',
      neutral: '#f4f6f9',
      ink: '#1a1a1a',
      white: '#ffffff',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      exception: '#d97706',
    },
    radius: { md: 8, pill: 999 },
    shadow: {
      card: {
        shadowColor: 'rgba(26,26,26,0.08)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
      },
    },
  },
  createShadowStyle: (t: Record<string, unknown>) => t,
}));

jest.mock('@relay/design-tokens', () => ({
  statusColor: (status: string) => {
    const map: Record<string, string> = {
      Delivered: '#2ECC71',
      'In Transit': '#FFB800',
      'Out for Delivery': '#FFB800',
      Pending: '#B38600',
      Exception: '#D97706',
    };
    return map[status] ?? '#6b7280';
  },
}));

// ── Realtime mock (no-op) ────────────────────────────────────────────────────
jest.mock('../lib/realtime', () => ({
  useShipmentSubscription: jest.fn(),
}));

// ── SDK mock ─────────────────────────────────────────────────────────────────
const mockGet = jest.fn();
const mockDelete = jest.fn();
const mockCreateShareLink = jest.fn();

jest.mock('../lib/sdk', () => ({
  useSdk: () => ({
    shipments: {
      get: mockGet,
      delete: mockDelete,
      createShareLink: mockCreateShareLink,
    },
  }),
}));

// ── Share API mock ───────────────────────────────────────────────────────────
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
}));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ShipmentDetailScreen from '../app/(app)/shipments/[id]';

const MOCK_SHIPMENT = {
  id: 'ship-test-1',
  userId: 'user-1',
  carrier: { code: 'USPS', displayName: 'USPS' },
  trackingNumber: '9400111899223409376213',
  nickname: 'Test Package',
  status: 'In Transit' as const,
  lastEventAt: new Date().toISOString(),
  eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  events: [
    {
      id: 'evt-1',
      shipmentId: 'ship-test-1',
      occurredAt: new Date().toISOString(),
      status: 'In Transit' as const,
      description: 'Package is in transit to destination',
      location: 'Memphis, TN',
    },
    {
      id: 'evt-2',
      shipmentId: 'ship-test-1',
      occurredAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'Pending' as const,
      description: 'Shipment accepted at origin facility',
      location: 'Austin, TX',
    },
  ],
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue(MOCK_SHIPMENT);
});

describe('ShipmentDetailScreen', () => {
  it('renders status pill with shipment status', async () => {
    const { findByTestId } = renderWithProviders(<ShipmentDetailScreen />);
    const pill = await findByTestId('status-pill');
    expect(pill).toBeTruthy();
    expect(pill.props.accessibilityLabel).toBe('Status: In Transit');
  });

  it('renders tracking number', async () => {
    const { findByTestId } = renderWithProviders(<ShipmentDetailScreen />);
    const tn = await findByTestId('tracking-number');
    expect(tn.props.children).toBe('9400111899223409376213');
  });

  it('renders ETA card when eta is present', async () => {
    const { findByTestId } = renderWithProviders(<ShipmentDetailScreen />);
    const eta = await findByTestId('eta-value');
    expect(eta).toBeTruthy();
    expect(eta.props.children).toMatch(/Arriving/i);
  });

  it('renders timeline events', async () => {
    const { findByText } = renderWithProviders(<ShipmentDetailScreen />);
    await findByText('Package is in transit to destination');
    await findByText('Memphis, TN');
  });

  it('renders share button', async () => {
    const { findByTestId } = renderWithProviders(<ShipmentDetailScreen />);
    const btn = await findByTestId('share-button');
    expect(btn).toBeTruthy();
  });

  it('renders delete button', async () => {
    const { findByTestId } = renderWithProviders(<ShipmentDetailScreen />);
    expect(await findByTestId('delete-button')).toBeTruthy();
  });

  it('shows loading state before data arrives', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { getByTestId } = renderWithProviders(<ShipmentDetailScreen />);
    expect(getByTestId('skeleton-0')).toBeTruthy();
  });

  it('shows error state when query fails', async () => {
    mockGet.mockRejectedValue(new Error('network error'));
    const { findByTestId } = renderWithProviders(<ShipmentDetailScreen />);
    await findByTestId('error-state');
  });

  it('calls share API when share button pressed', async () => {
    mockCreateShareLink.mockResolvedValue({
      token: 'abc123',
      url: 'https://relay.app/share/abc123',
      expiresAt: new Date().toISOString(),
    });
    const Share = require('react-native/Libraries/Share/Share');

    const { findByTestId } = renderWithProviders(<ShipmentDetailScreen />);
    const btn = await findByTestId('share-button');
    fireEvent.press(btn);

    await waitFor(() => {
      expect(mockCreateShareLink).toHaveBeenCalledWith('ship-test-1');
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'https://relay.app/share/abc123' }),
      );
    });
  });
});
