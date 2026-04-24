import expo from '@relay/config-eslint/expo';

export default [
  ...expo,
  {
    files: ['__tests__/**/*.{ts,tsx}'],
    rules: {
      'import/order': 'off',
    },
  },
];
