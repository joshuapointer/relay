# @relay/design-tokens

Source-of-truth design tokens for the Relay platform. Tokens are authored in
`tokens/*.json` (Style Dictionary 4 format) and compiled to multiple platform
targets via `pnpm build`.

## Package structure

```
packages/design-tokens/
├── tokens/              # Source JSON (edit these)
│   ├── color.json
│   ├── typography.json
│   ├── spacing.json
│   ├── radius.json
│   ├── shadow.json
│   └── z-index.json
├── src/                 # Hand-authored TS re-exports + helpers
│   ├── index.ts         # statusColor() helper + re-export
│   ├── native.ts        # createShadowStyle() + RN re-export
│   ├── css.ts           # CSS path export
│   └── __tests__/
│       └── brand-acceptance.test.ts
├── dist/                # Generated (do not edit)
│   ├── index.js         # Token object (ESM)
│   ├── tokens.css       # CSS custom properties
│   ├── tailwind-theme.js# Tailwind theme extension
│   └── native.js        # RN-compatible tokens
└── style-dictionary.config.mjs
```

## Build

```bash
pnpm --filter @relay/design-tokens build
```

This runs Style Dictionary 4 and writes all `dist/` artifacts.

## Consuming tokens

### Web (Tailwind)

```ts
// tailwind.config.ts
import { tailwindTheme } from '@relay/design-tokens/web';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      ...tailwindTheme,
    },
  },
};
```

Then use in JSX:

```tsx
<button className="bg-primary text-white px-5 py-3 rounded-md font-header">
  Track
</button>
```

### Web (CSS custom properties)

```ts
// app/layout.tsx or global CSS
import '@relay/design-tokens/dist/tokens.css';
```

```css
.card {
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-md);
}
```

### React Native

```ts
import { nativeTokens, createShadowStyle } from '@relay/design-tokens/native';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: nativeTokens.color.primary,
    paddingHorizontal: nativeTokens.spacing[5],
    borderRadius: nativeTokens.radius.md,
  },
  card: {
    backgroundColor: nativeTokens.color.surface,
    ...createShadowStyle(nativeTokens.shadow.card),
  },
});
```

### Status colors

```ts
import { statusColor } from '@relay/design-tokens';
// or: import type { DisplayShipmentStatus } from '@relay/design-tokens';

const color = statusColor('Delivered'); // '#2ECC71' — success green, Delivered ONLY
const color2 = statusColor('In Transit'); // '#FFB800' — accent amber
```

## Brand colors (authoritative)

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#003B73` | Deep Tech Blue — nav, headers, primary buttons, FAB |
| `secondary` | `#00C2CB` | Agile Teal — route lines, accents, highlights |
| `accent` | `#FFB800` | Alert Amber — In Transit, delay/warning pills |
| `success` | `#2ECC71` | Success Green — **Delivered status ONLY** |
| `neutral` | `#F4F6F9` | Cloud Gray — backgrounds, card surfaces, dividers |
| `ink` | `#1A1A1A` | Ink Black — body copy, headings |

## Testing

```bash
pnpm --filter @relay/design-tokens test
```

Brand acceptance tests in `src/__tests__/brand-acceptance.test.ts` cover BR-1 through BR-10.

## Typecheck

```bash
pnpm --filter @relay/design-tokens typecheck
```
