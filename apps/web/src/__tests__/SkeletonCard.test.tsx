import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SkeletonCard, SkeletonList } from '../../components/SkeletonCard';

describe('SkeletonCard', () => {
  it('renders with role=status', () => {
    render(<SkeletonCard />);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('has aria-busy=true', () => {
    render(<SkeletonCard />);
    const el = screen.getByRole('status');
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('has accessible label', () => {
    render(<SkeletonCard />);
    expect(screen.getByLabelText('Loading shipment')).toBeDefined();
  });
});

describe('SkeletonList', () => {
  it('renders N skeleton cards', () => {
    render(<SkeletonList count={3} />);
    expect(screen.getAllByRole('status')).toHaveLength(3);
  });

  it('defaults to 3 cards', () => {
    render(<SkeletonList />);
    expect(screen.getAllByRole('status')).toHaveLength(3);
  });
});
