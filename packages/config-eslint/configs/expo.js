import base from './base.js';

/** @type {import('typescript-eslint').Config} */
const expo = [
  ...base,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];

export default expo;
