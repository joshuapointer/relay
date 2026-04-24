/**
 * BrandIcon component tests (Vitest + RTL)
 *
 * Verifies:
 * - Renders SVG with correct width/height from size prop
 * - role="img" and aria-label present for accessibility
 * - Variant switching applies correct stroke colors
 */

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { BrandIcon } from '../Icon.js';

describe('BrandIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<BrandIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('sets width and height to size prop (default 24)', () => {
    const { container } = render(<BrandIcon />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
  });

  it('sets width and height from size={64}', () => {
    const { container } = render(<BrandIcon size={64} />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('width')).toBe('64');
    expect(svg.getAttribute('height')).toBe('64');
  });

  it('has role="img"', () => {
    const { container } = render(<BrandIcon size={64} />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('role')).toBe('img');
  });

  it('has aria-label "Relay"', () => {
    const { container } = render(<BrandIcon size={64} />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('aria-label')).toBe('Relay');
  });

  it('has <title>Relay</title> for screen reader support', () => {
    const { container } = render(<BrandIcon size={64} />);
    const title = container.querySelector('title');
    expect(title?.textContent).toBe('Relay');
  });

  it('default variant renders with Deep Tech Blue #003B73 stroke on main path', () => {
    const { container } = render(<BrandIcon variant="default" />);
    const path = container.querySelector('path');
    expect(path?.getAttribute('stroke')).toBe('#003B73');
  });

  it('light variant renders with white #FFFFFF stroke on main path', () => {
    const { container } = render(<BrandIcon variant="light" />);
    const path = container.querySelector('path');
    expect(path?.getAttribute('stroke')).toBe('#FFFFFF');
  });

  it('light variant renders Agile Teal #00C2CB on arrowhead', () => {
    const { container } = render(<BrandIcon variant="light" />);
    const polyline = container.querySelector('polyline');
    expect(polyline?.getAttribute('stroke')).toBe('#00C2CB');
  });

  it('color prop overrides stem stroke color', () => {
    const { container } = render(<BrandIcon color="#FF0000" />);
    const path = container.querySelector('path');
    expect(path?.getAttribute('stroke')).toBe('#FF0000');
  });

  it('applies optional className', () => {
    const { container } = render(<BrandIcon className="test-class" />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.className.baseVal).toContain('test-class');
  });

  it('viewBox is 0 0 48 48', () => {
    const { container } = render(<BrandIcon />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('viewBox')).toBe('0 0 48 48');
  });
});
