import type { Config } from 'tailwindcss';

/**
 * Theme values sourced from @relay/design-tokens.
 * Inlined here to avoid CJS/ESM resolution issues when jiti loads this config.
 * Source of truth: packages/design-tokens/dist/tailwind-theme.js
 * Update this object whenever design tokens change (WS-D owns token updates).
 */
const relayColors = {
  primary: '#003b73',
  secondary: '#00c2cb',
  accent: '#ffb800',
  success: '#2ecc71',
  neutral: '#f4f6f9',
  ink: '#1a1a1a',
  white: '#ffffff',
  background: '#f4f6f9',
  surface: '#ffffff',
  text: '#1a1a1a',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  inTransit: '#ffb800',
  delivered: '#2ecc71',
  pending: '#b38600',
  exception: '#d97706',
  primaryForeground: '#ffffff',
  outForDelivery: '#ffb800',
} as const;

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    '../../packages/ui-core/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: relayColors,
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        header: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        pill: '999px',
      },
      boxShadow: {
        card: '0px 2px 8px 0px rgba(26,26,26,0.08)',
        fab: '0px 4px 16px 0px rgba(26,26,26,0.20)',
      },
    },
  },
  plugins: [],
};

export default config;
