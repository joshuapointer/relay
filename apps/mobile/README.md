# @relay/mobile

Expo SDK 51 + Expo Router v3 mobile app for Relay shipment tracking.

## Running locally

```bash
# Install dependencies from repo root
pnpm install

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

## MVP limitations

- No EAS build/submit configured for MVP — run locally via `expo start`
- No real push notifications (requires APNs/FCM credentials)
- Socket.IO client stubbed — WS-C-02 wires real-time updates
- Font assets are placeholders — WS-D-03c vendors Poppins + Inter TTFs
- App icon/splash are placeholders — WS-D-03b generates final assets
- No real API calls — WS-C-02/03 wire `@relay/sdk` data hooks

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
