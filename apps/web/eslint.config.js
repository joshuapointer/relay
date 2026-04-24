import react from '@relay/config-eslint/react';

/** @type {import('typescript-eslint').Config} */
export default [
  ...react,
  {
    rules: {
      // Next.js App Router uses async server components — allow async default exports
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'coverage/**'],
  },
];
