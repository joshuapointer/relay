import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorState } from '../../components/ErrorState';

describe('ErrorState', () => {
  it('renders default message', () => {
    render(<ErrorState />);
    expect(screen.getByText(/something went wrong/i)).toBeDefined();
  });

  it('renders custom message', () => {
    render(<ErrorState message="Could not load shipments." />);
    expect(screen.getByText('Could not load shipments.')).toBeDefined();
  });

  it('has role=alert for a11y', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeDefined();
  });

  it('calls onRetry when retry button clicked', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does not render retry button when onRetry not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
