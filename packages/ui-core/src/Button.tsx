/**
 * Button — shared TypeScript interface only.
 *
 * Platform implementations live in Button.web.tsx and Button.native.tsx.
 * Bundlers resolve the correct file via platform extensions.
 *
 * This file re-exports the web implementation as the default so the
 * package can be imported in non-platform-aware tooling (e.g. Jest with jsdom).
 */
export { Button } from './Button.web.js';
export type { ButtonProps } from './Button.web.js';
