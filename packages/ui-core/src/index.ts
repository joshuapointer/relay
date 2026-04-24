/**
 * @relay/ui-core — cross-platform UI primitives barrel
 *
 * Platform-specific implementations are resolved at bundle time via
 * Metro (mobile) and Webpack/Vite (web) using .native.tsx / .web.tsx extensions.
 */

export { Button } from './Button.js';
export type { ButtonProps } from './Button.js';

export { Text } from './Text.js';
export type { TextProps } from './Text.js';

export { Card } from './Card.js';
export type { CardProps } from './Card.js';

export { StatusPill } from './StatusPill.js';
export type { StatusPillProps } from './StatusPill.js';

export { Badge } from './Badge.js';
export type { BadgeProps } from './Badge.js';

export { Wordmark } from './Wordmark.js';
export type { WordmarkProps } from './Wordmark.js';

export { Icon } from './Icon.js';
export type { IconProps } from './Icon.js';

// Brand components — WS-D-03a
export { BrandIcon } from './brand/index.js';
export type { BrandIconProps } from './brand/index.js';

export { BrandWordmark } from './brand/index.js';
export type { BrandWordmarkProps } from './brand/index.js';

export { BrandLogo } from './brand/index.js';
export type { BrandLogoProps } from './brand/index.js';
