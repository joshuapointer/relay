/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    '^@relay/design-tokens/native$':
      '<rootDir>/../../packages/design-tokens/src/native.ts',
    '^@relay/design-tokens$':
      '<rootDir>/../../packages/design-tokens/src/index.ts',
    '^@relay/shared-types$':
      '<rootDir>/../../packages/shared-types/src/index.ts',
    '^@relay/sdk$': '<rootDir>/../../packages/sdk/src/index.ts',
    '^@relay/ui-core$': '<rootDir>/../../packages/ui-core/src/index.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
  // pnpm monorepo: packages live in root node_modules/.pnpm/<pkg@ver_hash>/node_modules/<pkg>
  // The pattern matches every 'node_modules/' occurrence in the absolute path.
  // Including '.pnpm/' in the allow-list means we never ignore the pnpm store prefix,
  // so the SECOND 'node_modules/<pkg>' inside the pnpm path is also evaluated and
  // ecosystem packages get transformed there too.
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '\\.pnpm/' +
      '|(jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo' +
      '|@expo' +
      '|@expo-google-fonts' +
      '|react-navigation' +
      '|@react-navigation' +
      '|@unimodules' +
      '|unimodules' +
      '|sentry-expo' +
      '|native-base' +
      '|react-native-svg' +
      '|socket\\.io-client' +
      '|engine\\.io-client' +
    '))',
  ],
};
