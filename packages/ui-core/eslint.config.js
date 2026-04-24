import react from '@relay/config-eslint/react';

/** @type {import("eslint").Linter.Config[]} */
export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  ...react,
];
