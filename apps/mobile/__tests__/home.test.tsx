/**
 * Home screen tests — render with mocked SDK + Clerk, assert greeting,
 * FAB, empty state; press FAB → expect router.push called with /(app)/add.
 */
import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

// ── Router mock ─────────────────────────────────────────────────────────────
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  Redirect: () => null,
  Stack: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── SafeArea mock ────────────────────────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
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
  createShadowStyle: (token: Record<string, unknown>) => token,
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

// ── SDK mock ─────────────────────────────────────────────────────────────────
const mockShipmentsList = jest.fn();

jest.mock('../lib/sdk', () => ({
  useSdk: () => ({
    shipments: {
      list: mockShipmentsList,
    },
  }),
}));

// ── TanStack Query ────────────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HomeScreen from '../app/(app)/home';
import { MockAuthContext } from '../components/ClerkMock';

const mockSignedInContext = {
  isLoaded: true,
  isSignedIn: true,
  userId: 'mock-user-001',
  user: {
    id: 'mock-user-001',
    emailAddresses: [{ emailAddress: 'demo@relay.app' }],
    firstName: 'Demo',
    lastName: 'User',
    fullName: 'Demo User',
  },
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MockAuthContext.Provider value={mockSignedInContext}>
        {ui}
      </MockAuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: loading state
  mockShipmentsList.mockReturnValue(new Promise(() => {}));
});

describe('HomeScreen', () => {
  it('renders the brand header', () => {
    const { getByTestId } = renderWithProviders(<HomeScreen />);
    expect(getByTestId('brand-header')).toBeTruthy();
  });

  it('renders "Welcome back" greeting with user first name', () => {
    const { getByText } = renderWithProviders(<HomeScreen />);
    expect(getByText(/Welcome back, Demo/i)).toBeTruthy();
  });

  it('renders the FAB', () => {
    const { getByTestId } = renderWithProviders(<HomeScreen />);
    expect(getByTestId('home-fab')).toBeTruthy();
  });

  it('pressing FAB calls router.push with /(app)/add', () => {
    const { getByTestId } = renderWithProviders(<HomeScreen />);
    fireEvent.press(getByTestId('home-fab'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/add');
  });

  it('shows loading skeletons while query is pending', () => {
    const { getByTestId } = renderWithProviders(<HomeScreen />);
    expect(getByTestId('loading-state')).toBeTruthy();
  });

  it('shows empty state when shipments list is empty', async () => {
    mockShipmentsList.mockResolvedValue({ items: [], cursor: undefined });
    const { findByTestId } = renderWithProviders(<HomeScreen />);
    await findByTestId('empty-state');
  });

  it('shows error state when query fails', async () => {
    mockShipmentsList.mockRejectedValue(new Error('network error'));
    const { findByTestId } = renderWithProviders(<HomeScreen />);
    await findByTestId('error-state');
  });

  it('renders shipment cards when data is loaded', async () => {
    mockShipmentsList.mockResolvedValue({
      items: [
        {
          id: 'ship-1',
          userId: 'user-1',
          carrier: { code: 'USPS', displayName: 'USPS' },
          trackingNumber: '9400111899223409376213',
          nickname: 'Birthday gift',
          status: 'In Transit',
          lastEventAt: null,
          eta: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    const { findByText } = renderWithProviders(<HomeScreen />);
    await findByText('Birthday gift');
  });

  it('renders status filter tabs', () => {
    const { getByText } = renderWithProviders(<HomeScreen />);
    expect(getByText('All')).toBeTruthy();
    expect(getByText('In Transit')).toBeTruthy();
    expect(getByText('Delivered')).toBeTruthy();
  });
});
