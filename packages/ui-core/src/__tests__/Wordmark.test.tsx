import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Wordmark } from '../Wordmark.js';

describe('Wordmark', () => {
  it('renders exact text "Relay" (uppercase R, lowercase elay)', () => {
    const { container } = render(<Wordmark />);
    const el = container.firstChild as HTMLElement;
    expect(el.textContent).toBe('Relay');
  });

  it('font-family references Poppins', () => {
    const { container } = render(<Wordmark />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.fontFamily).toContain('Poppins');
  });

  it('font-weight is bold (700)', () => {
    const { container } = render(<Wordmark />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.fontWeight).toBe('700');
  });

  it('accepts color override', () => {
    const { container } = render(<Wordmark color="#ffffff" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.color).toBe('rgb(255, 255, 255)');
  });

  it('respects height prop and sets font size proportionally', () => {
    const { container } = render(<Wordmark height={48} />);
    const el = container.firstChild as HTMLElement;
    // fontSize = height * 0.75 = 36px
    expect(el.style.fontSize).toBe('36px');
  });

  it('has aria-label "Relay"', () => {
    const { container } = render(<Wordmark />);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Relay');
  });
});
