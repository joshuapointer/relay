/**
 * Add screen tests — render form, fill fields, submit, assert
 * sdk.shipments.create called with correct args.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

// ── Router mock ──────────────────────────────────────────────────────────────
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: mockBack,
  }),
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

// ── SDK mock ─────────────────────────────────────────────────────────────────
const mockCreate = jest.fn();

jest.mock('../lib/sdk', () => ({
  useSdk: () => ({
    shipments: {
      create: mockCreate,
    },
  }),
}));

import AddScreen from '../app/(app)/add';

function renderAdd() {
  return render(<AddScreen />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AddScreen', () => {
  it('renders tracking number input', () => {
    const { getByTestId } = renderAdd();
    expect(getByTestId('add-tracking-number')).toBeTruthy();
  });

  it('renders nickname input', () => {
    const { getByTestId } = renderAdd();
    expect(getByTestId('add-nickname')).toBeTruthy();
  });

  it('submit button is disabled when tracking number is empty', () => {
    const { getByTestId } = renderAdd();
    const btn = getByTestId('add-submit');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('submit button is enabled when tracking number is filled', () => {
    const { getByTestId } = renderAdd();
    fireEvent.changeText(getByTestId('add-tracking-number'), '9400111899223409376213');
    const btn = getByTestId('add-submit');
    expect(btn.props.accessibilityState?.disabled).toBe(false);
  });

  it('calls sdk.shipments.create with correct args on submit', async () => {
    mockCreate.mockResolvedValue({
      id: 'ship-1',
      userId: 'user-1',
      carrier: { code: 'USPS', displayName: 'USPS' },
      trackingNumber: '9400111899223409376213',
      status: 'Pending',
      lastEventAt: null,
      eta: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { getByTestId } = renderAdd();
    fireEvent.changeText(getByTestId('add-tracking-number'), '9400111899223409376213');
    fireEvent.changeText(getByTestId('add-nickname'), 'Test Package');
    fireEvent.press(getByTestId('add-submit'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        trackingNumber: '9400111899223409376213',
        carrierCode: undefined,
        nickname: 'Test Package',
      });
    });
  });

  it('navigates to shipment detail on successful submit', async () => {
    mockCreate.mockResolvedValue({
      id: 'ship-abc',
      userId: 'user-1',
      carrier: { code: 'UPS', displayName: 'UPS' },
      trackingNumber: '1Z999AA10123456784',
      status: 'Pending',
      lastEventAt: null,
      eta: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { getByTestId } = renderAdd();
    fireEvent.changeText(getByTestId('add-tracking-number'), '1Z999AA10123456784');
    fireEvent.press(getByTestId('add-submit'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(app)/shipments/ship-abc');
    });
  });

  it('shows error message when create fails', async () => {
    mockCreate.mockRejectedValue(new Error('network error'));

    const { getByTestId, findByText } = renderAdd();
    fireEvent.changeText(getByTestId('add-tracking-number'), '9400111899223409376213');
    fireEvent.press(getByTestId('add-submit'));

    await findByText(/Unable to add that shipment/i);
  });

  it('pressing cancel calls router.back', () => {
    const { getByText } = renderAdd();
    fireEvent.press(getByText('Cancel'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('selects a carrier chip', () => {
    const { getByTestId } = renderAdd();
    const uspsChip = getByTestId('carrier-USPS');
    fireEvent.press(uspsChip);
    expect(uspsChip.props.accessibilityState?.selected).toBe(true);
  });

  it('passes carrierCode to create when carrier chip selected', async () => {
    mockCreate.mockResolvedValue({
      id: 'ship-2',
      userId: 'user-1',
      carrier: { code: 'USPS', displayName: 'USPS' },
      trackingNumber: '9400111899223409376213',
      status: 'Pending',
      lastEventAt: null,
      eta: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { getByTestId } = renderAdd();
    fireEvent.changeText(getByTestId('add-tracking-number'), '9400111899223409376213');
    fireEvent.press(getByTestId('carrier-USPS'));
    fireEvent.press(getByTestId('add-submit'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ carrierCode: 'USPS' }),
      );
    });
  });
});
