/**
 * Text — re-exports web implementation as default.
 * Metro resolves Text.native.tsx for RN; web bundlers use Text.web.tsx.
 */
export { Text } from './Text.web.js';
export type { TextProps, TextVariant, TextFamily } from './Text.web.js';
