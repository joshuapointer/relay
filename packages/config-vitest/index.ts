import type { UserConfig } from 'vitest/config';

export interface VitestConfigOptions {
  /** Root directory for the package (default: process.cwd()) */
  root?: string;
  /** Test environment (default: 'node') */
  environment?: 'node' | 'jsdom' | 'happy-dom';
  /** Additional include patterns */
  include?: string[];
  /** Additional exclude patterns */
  exclude?: string[];
}

/**
 * Creates a Vitest UserConfig with opinionated defaults.
 * @vitest/coverage-v8 is enabled; globals are false (use explicit imports).
 */
export function createVitestConfig(opts: VitestConfigOptions = {}): UserConfig {
  const {
    root,
    environment = 'node',
    include = ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude = ['node_modules', 'dist', 'build'],
  } = opts;

  return {
    ...(root ? { root } : {}),
    test: {
      globals: false,
      environment,
      include,
      exclude,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/**',
          'dist/**',
          'build/**',
          '**/*.d.ts',
          '**/*.config.*',
          '**/index.ts',
        ],
      },
    },
  };
}
