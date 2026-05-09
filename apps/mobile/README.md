# Relay Mobile

React Native app for cross-platform shipment tracking.

## Stack

- **Expo SDK 51**
- **Expo Router**
- **Clerk** authentication
- **TanStack Query**
- **Socket.IO**
- Internal design tokens

## Setup

```bash
# Install dependencies from repo root
pnpm install

# Build packages
pnpm build

# Run EAS development build
cd apps/mobile
npx eas build --profile development
```

## Running locally

```bash
# Start dev server
pnpm --filter @relay/mobile start
# or
pnpm --filter @relay/mobile exec expo start

# Platform-specific
pnpm --filter @relay/mobile ios
pnpm --filter @relay/mobile android
pnpm --filter @relay/mobile web
```

## Type-checking

```bash
pnpm --filter @relay/mobile typecheck
```

## Tests

```bash
pnpm --filter @relay/mobile test
```

Uses Jest with `jest-expo` preset (mobile only — web/api use Vitest).

## Web export

```bash
pnpm --filter @relay/mobile build:web
# Outputs to apps/mobile/dist/
```

## Mock mode (default for MVP)

`CLERK_MOCK_MODE=true` is set in `app.json` extras. The app runs without Clerk credentials.
A demo user (`demo@relay.app`) is available — any email/password combo will sign in.

To use real Clerk auth, copy `.env.example` to `.env.local` and set:
```
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_MOCK_MODE=false
```

## Screenshots

<!-- TODO: Add screenshots here -->

## Architecture

```
app/
  _layout.tsx          — root: ClerkOrMockProvider + QueryClient + SafeArea
  (auth)/
    _layout.tsx        — redirect to home if signed in
    sign-in.tsx
    sign-up.tsx
  (app)/
    _layout.tsx        — redirect to sign-in if not signed in
    home.tsx           — shipment list + FAB
    add.tsx            — add tracking modal
    profile.tsx        — account + sign out + delete (AC-12)
    shipments/[id].tsx — detail screen
  +not-found.tsx

components/
  ClerkMock.tsx    — mock auth provider for development without Clerk keys
  FAB.tsx          — floating action button primitive
  TrackingCard.tsx — shipment card with status pill + location

src/sockets/client.ts  — Socket.IO singleton factory (stubbed)
```
