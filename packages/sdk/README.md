# @relay/sdk

Typed HTTP and WebSocket client for the Relay API. Consumed by `apps/web` and `apps/mobile`.

## Usage

```ts
import { createRelayClient, createRelayRealtime } from '@relay/sdk';

const client = createRelayClient({
  baseUrl: 'https://api.relay.app/v1',
  getAuthToken: async () => clerkSession.getToken(),
});

const shipments = await client.shipments.list();
const detail = await client.shipments.get('cld_abc123');
```

## Error handling

- `RelayAuthError` — 401 response
- `RelayClientError` — 4xx response with parsed API error body
- `RelayNetworkError` — fetch threw (no network, timeout)
- `RelayValidationError` — response failed Zod schema validation

## Sub-path exports

- `@relay/sdk` — full client + errors
- `@relay/sdk/rest` — REST client only
- `@relay/sdk/realtime` — Socket.IO realtime client only
