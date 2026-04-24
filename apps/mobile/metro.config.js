const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch monorepo packages for changes
config.watchFolders = [monorepoRoot];

// Resolve modules from project root first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Enable package exports for RN 0.74 compatibility
config.resolver.unstable_enablePackageExports = true;

// Follow symlinks (pnpm uses symlinks extensively)
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
