/**
 * @relay/design-tokens/css
 *
 * Exports the resolved path to the generated CSS custom properties file
 * so consumers can import it directly.
 *
 * Usage (Node/bundler):
 * ```ts
 * import { cssPath } from '@relay/design-tokens/css';
 * // cssPath === '/absolute/path/to/dist/tokens.css'
 * ```
 *
 * Usage (Next.js app/layout.tsx):
 * ```ts
 * import '@relay/design-tokens/dist/tokens.css';
 * ```
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Absolute path to the generated tokens.css file.
 * Use with require.resolve or direct import in bundlers.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const cssPath: string = require.resolve('@relay/design-tokens/dist/tokens.css');
