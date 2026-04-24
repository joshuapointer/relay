/**
 * BrandWordmark component tests (Vitest + RTL)
 *
 * Verifies:
 * - "Relay" text / title is accessible
 * - Default fill is Ink Black #1A1A1A
 * - Light variant uses white fill
 * - Height prop scales the SVG
 * - Minimum height clamped to 24px per BR-13
 */

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { BrandWordmark } from '../Wordmark.js';

describe('BrandWordmark', () => {
  it('renders an SVG element', () => {
    const { container } = render(<BrandWordmark />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('has role="img" for accessibility', () => {
    const { container } = render(<BrandWordmark />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('role')).toBe('img');
  });

  it('aria-label defaults to "Relay"', () => {
    const { container } = render(<BrandWordmark />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('aria-label')).toBe('Relay');
  });

  it('<title> contains "Relay" for screen reader support', () => {
    const { container } = render(<BrandWordmark />);
    const title = container.querySelector('title');
    expect(title?.textContent).toBe('Relay');
  });

  it('<text> element contains "Relay"', () => {
    const { container } = render(<BrandWordmark />);
    const text = container.querySelector('text');
    expect(text?.textContent).toContain('Relay');
  });

  it('default fill is Ink Black #1A1A1A', () => {
    const { container } = render(<BrandWordmark />);
    const text = container.querySelector('text');
    expect(text?.getAttribute('fill')).toBe('#1A1A1A');
  });

  it('light variant fill is white #FFFFFF', () => {
    const { container } = render(<BrandWordmark variant="light" />);
    const text = container.querySelector('text');
    expect(text?.getAttribute('fill')).toBe('#FFFFFF');
  });

  it('color prop overrides fill', () => {
    const { container } = render(<BrandWordmark color="#003B73" />);
    const text = container.querySelector('text');
    expect(text?.getAttribute('fill')).toBe('#003B73');
  });

  it('default height=32 sets SVG height attribute to 32', () => {
    const { container } = render(<BrandWordmark />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('height')).toBe('32');
  });

  it('height prop sets SVG height attribute', () => {
    const { container } = render(<BrandWordmark height={48} />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('height')).toBe('48');
  });

  it('BR-13: minimum height clamped to 24px', () => {
    const { container } = render(<BrandWordmark height={10} />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(Number(svg.getAttribute('height'))).toBeGreaterThanOrEqual(24);
  });

  it('text uses Poppins font-family', () => {
    const { container } = render(<BrandWordmark />);
    const text = container.querySelector('text');
    expect(text?.getAttribute('font-family')).toContain('Poppins');
  });

  it('text font-weight is 700 (bold)', () => {
    const { container } = render(<BrandWordmark />);
    const text = container.querySelector('text');
    expect(text?.getAttribute('font-weight')).toBe('700');
  });
});
