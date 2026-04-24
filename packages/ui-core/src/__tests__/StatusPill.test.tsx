import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect } from 'vitest';

import { StatusPill } from '../StatusPill.js';
import type { DisplayShipmentStatus } from '../tokens.js';

afterEach(cleanup);

describe('StatusPill', () => {
  it('renders Delivered status with green color #2ECC71', () => {
    const { container } = render(<StatusPill status="Delivered" />);
    const pill = container.firstChild as HTMLElement;
    // Background should contain rgba derived from #2ECC71 at 0.15 alpha
    expect(pill.style.backgroundColor).toContain('rgba(46, 204, 113');
    // Text color — jsdom normalizes hex to rgb
    const label = pill.querySelector('span') as HTMLElement;
    expect(label.style.color).toContain('46, 204, 113');
  });

  it('renders In Transit status with amber color #FFB800', () => {
    const { container } = render(<StatusPill status="In Transit" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.style.backgroundColor).toContain('rgba(255, 184, 0');
    const label = pill.querySelector('span') as HTMLElement;
    expect(label.style.color).toContain('255, 184, 0');
  });

  it('renders Exception status — NOT green (#2ECC71 not present)', () => {
    const { container } = render(<StatusPill status="Exception" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.style.backgroundColor).not.toContain('rgba(46, 204, 113');
    const label = pill.querySelector('span') as HTMLElement;
    expect(label.style.color).not.toContain('46, 204, 113');
  });

  it('renders every status value without crashing', () => {
    const statuses: DisplayShipmentStatus[] = [
      'Pending',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Exception',
    ];
    for (const status of statuses) {
      const { container } = render(<StatusPill status={status} />);
      expect(container.firstChild).toBeTruthy();
      // Text label always present for accessibility (AC-9)
      const label = container.querySelector('span span') as HTMLElement;
      expect(label.textContent).toBe(status);
    }
  });

  it('has accessible role=status and aria-label', () => {
    render(<StatusPill status="Delivered" />);
    const el = screen.getByRole('status', { name: 'Delivered' });
    expect(el).toBeTruthy();
  });
});
