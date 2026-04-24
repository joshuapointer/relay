import base from './base.js';

/** @type {import('typescript-eslint').Config} */
const react = [
  ...base,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];

export default react;
