import { resolve } from 'path';

import { createVitestConfig } from '@relay/config-vitest';
import { defineConfig } from 'vitest/config';

const base = createVitestConfig({ environment: 'node' });

export default defineConfig({
  ...base,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    ...base.test,
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],
    setupFiles: ['./tests/setup.ts'],
  },
});
