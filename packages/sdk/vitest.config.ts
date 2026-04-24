import { createVitestConfig } from '@relay/config-vitest';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const base = createVitestConfig({ environment: 'node' });

export default {
  ...base,
  resolve: {
    alias: {
      '@relay/shared-types': resolve(__dirname, '../shared-types/src/index.ts'),
    },
  },
};
