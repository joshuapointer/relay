import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';

import { Button } from '../Button.web.js';

afterEach(cleanup);

describe('Button (web)', () => {
  it('renders primary variant with primary token color #003B73', () => {
    const { container } = render(<Button variant="primary">Click me</Button>);
    const btn = container.firstChild as HTMLElement;
    // Tailwind class bg-[#003B73] should be present in className
    expect(btn.className).toContain('#003B73');
  });

  it('renders children', () => {
    render(<Button>Hello</Button>);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('is disabled when disabled=true', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const btn = container.firstChild as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('is disabled when loading=true', () => {
    const { container } = render(<Button loading>Loading</Button>);
    const btn = container.firstChild as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('calls onClick when clicked', () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls onPress when clicked (alias)', () => {
    const handler = vi.fn();
    render(<Button onPress={handler}>Press</Button>);
    fireEvent.click(screen.getByText('Press'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handler = vi.fn();
    render(
      <Button disabled onClick={handler}>
        Disabled
      </Button>,
    );
    const btn = screen.getByText('Disabled').closest('button') as HTMLButtonElement;
    fireEvent.click(btn);
    expect(handler).not.toHaveBeenCalled();
  });

  it('renders secondary variant', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders ghost variant', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders danger variant', () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
    expect(container.firstChild).toBeTruthy();
  });
});
