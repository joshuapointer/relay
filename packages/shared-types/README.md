# @relay/shared-types

Central Zod schemas and TypeScript types shared across all Relay packages and apps.

## Usage

```ts
import { ShipmentSchema, toDisplay, InternalShipmentStatusSchema } from '@relay/shared-types';
import type { Shipment, DisplayShipmentStatus } from '@relay/shared-types';
```

## Sub-path exports

- `@relay/shared-types` — all schemas
- `@relay/shared-types/status` — shipment status enums + mapper
- `@relay/shared-types/shipment` — Shipment, TrackingEvent, list/detail schemas
- `@relay/shared-types/notification` — Notification schemas
- `@relay/shared-types/share` — ShareLink + PublicShipmentView
