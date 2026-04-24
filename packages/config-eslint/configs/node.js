import base from './base.js';

/** @type {import('typescript-eslint').Config} */
const node = [
  ...base,
  {
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];

export default node;
