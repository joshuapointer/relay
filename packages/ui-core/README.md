# @relay/ui-core

Cross-platform UI primitives for Relay, consumed by both the web (Next.js) and mobile (Expo RN) apps.

## Platform resolution

Components with platform-specific implementations use Metro/Webpack platform extensions:

- `Button.web.tsx` — web implementation (Tailwind classes, `<button>`)
- `Button.native.tsx` — RN implementation (Pressable + StyleSheet)

Web bundlers (Vite, Webpack) resolve `.web.tsx` files. Metro resolves `.native.tsx` files.
The barrel files (`Button.tsx`, `Card.tsx`, `Text.tsx`) re-export the web implementation as a
safe default so the package works in non-platform-aware tooling (vitest, jsdom).

## Export conventions

```ts
// Default entry — all primitives
import { Button, Card, StatusPill, Text, Badge, Wordmark, Icon } from '@relay/ui-core';

// Web-specific re-exports
import { Button } from '@relay/ui-core/web';

// Native-specific re-exports
import { Button } from '@relay/ui-core/native';
```

## Primitives

| Component   | Web | Native | Notes |
|-------------|-----|--------|-------|
| `Button`    | ✅  | ✅     | variants: primary/secondary/ghost/danger; sizes: sm/md/lg |
| `Text`      | ✅  | ✅     | variants: display/h1/h2/h3/bodyLg/body/caption |
| `Card`      | ✅  | ✅     | BR-26: white bg, radius.md, shadow.card, 16px padding |
| `StatusPill`| ✅  | —      | status → color via `statusColor()` from @relay/design-tokens |
| `Badge`     | ✅  | —      | small metadata label pill |
| `Wordmark`  | ✅  | —      | text "Relay" in Poppins Bold; placeholder until WS-D-03a SVG |
| `Icon`      | ✅  | —      | placeholder stub; real SVG arrives via WS-D-03a |

## Design tokens

All colors come from `@relay/design-tokens`. No hardcoded hex strings in component logic.

## Testing

```bash
pnpm --filter @relay/ui-core test
```

Tests run on the web side (jsdom). Native rendering is tested via RNTL in WS-C tasks.
