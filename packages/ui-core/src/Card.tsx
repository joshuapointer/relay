/**
 * Card — re-exports web implementation as default.
 * Metro resolves Card.native.tsx for RN; web bundlers use Card.web.tsx.
 */
export { Card } from './Card.web.js';
export type { CardProps } from './Card.web.js';
