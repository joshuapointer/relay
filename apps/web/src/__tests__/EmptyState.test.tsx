import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '../../components/EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No shipments yet." />);
    expect(screen.getByText('No shipments yet.')).toBeDefined();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="Track your first package." />);
    expect(screen.getByText('Track your first package.')).toBeDefined();
  });

  it('renders action when provided', () => {
    render(
      <EmptyState
        title="Empty"
        action={<button type="button">Add tracking</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Add tracking' })).toBeDefined();
  });

  it('has role=status for a11y', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('has aria-live=polite for a11y', () => {
    render(<EmptyState title="Empty" />);
    const el = screen.getByRole('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
  });
});
