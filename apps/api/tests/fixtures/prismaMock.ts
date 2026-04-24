import { vi } from 'vitest';

type Row = Record<string, unknown>;
type Where = Record<string, unknown>;

interface Table<T extends Row> {
  rows: T[];
  nextId: number;
}

function makeTable<T extends Row>(): Table<T> {
  return { rows: [], nextId: 1 };
}

function genId(prefix: string, n: number): string {
  return `${prefix}_${n.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function matches(row: Row, where: Where): boolean {
  for (const [k, v] of Object.entries(where ?? {})) {
    if (v === undefined) continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      // nested composite / operators — only supports {equals} + AND
      if ('equals' in (v as Where)) {
        if ((row as Row)[k] !== (v as Row)['equals']) return false;
      } else {
        // composite key object: check all sub-fields
        for (const [k2, v2] of Object.entries(v as Where)) {
          if ((row as Row)[k2] !== v2) return false;
        }
      }
    } else if ((row as Row)[k] !== v) {
      return false;
    }
  }
  return true;
}

function resolveWhereUnique<T extends Row>(tbl: Table<T>, where: Where): T | undefined {
  // Handle composite @@unique([trackingNumber, carrierId]) inputs like { trackingNumber_carrierId: {...} }
  const compositeKey = Object.keys(where).find((k) => k.includes('_'));
  if (compositeKey && typeof where[compositeKey] === 'object') {
    return tbl.rows.find((r) => matches(r, where[compositeKey] as Where));
  }
  return tbl.rows.find((r) => matches(r, where));
}

export interface MockPrismaOptions {
  seed?: {
    users?: Row[];
    carriers?: Row[];
    shipments?: Row[];
    trackingEvents?: Row[];
    notifications?: Row[];
    webhookEvents?: Row[];
    shareLinks?: Row[];
    pushTokens?: Row[];
  };
}

/**
 * Lightweight in-memory Prisma stand-in. Supports the subset of operations
 * the API currently exercises. Not a general-purpose Prisma mock — add what
 * you need per-test.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createPrismaMock(opts: MockPrismaOptions = {}): any {
  const users = makeTable<Row>();
  const carriers = makeTable<Row>();
  const shipments = makeTable<Row>();
  const trackingEvents = makeTable<Row>();
  const notifications = makeTable<Row>();
  const webhookEvents = makeTable<Row>();
  const shareLinks = makeTable<Row>();
  const pushTokens = makeTable<Row>();

  for (const r of opts.seed?.users ?? []) users.rows.push(r);
  for (const r of opts.seed?.carriers ?? []) carriers.rows.push(r);
  for (const r of opts.seed?.shipments ?? []) shipments.rows.push(r);
  for (const r of opts.seed?.trackingEvents ?? []) trackingEvents.rows.push(r);
  for (const r of opts.seed?.notifications ?? []) notifications.rows.push(r);
  for (const r of opts.seed?.webhookEvents ?? []) webhookEvents.rows.push(r);
  for (const r of opts.seed?.shareLinks ?? []) shareLinks.rows.push(r);
  for (const r of opts.seed?.pushTokens ?? []) pushTokens.rows.push(r);

  const now = (): Date => new Date();

  function includeRelations<T extends Row>(
    row: T,
    table: 'shipment' | 'user' | 'share',
    include?: Record<string, unknown>
  ): T {
    if (!include) return row;
    const out: Row = { ...row };
    if (table === 'shipment') {
      if (include['events']) {
        const evts = trackingEvents.rows
          .filter((e) => e['shipmentId'] === row['id'])
          .sort(
            (a, b) =>
              new Date(b['occurredAt'] as string).getTime() -
              new Date(a['occurredAt'] as string).getTime()
          );
        out['events'] = evts;
      }
      if (include['carrier']) {
        out['carrier'] = carriers.rows.find((c) => c['id'] === row['carrierId']);
      }
      if (include['user']) {
        out['user'] = users.rows.find((u) => u['id'] === row['userId']);
      }
    }
    if (table === 'share') {
      if (include['shipment']) {
        const s = shipments.rows.find((sh) => sh['id'] === row['shipmentId']);
        if (s) {
          out['shipment'] = includeRelations(
            s,
            'shipment',
            include['shipment'] && typeof include['shipment'] === 'object'
              ? (include['shipment'] as { include?: Record<string, unknown> })['include']
              : undefined
          );
        }
      }
    }
    return out as T;
  }

  function mkCrud<T extends Row>(
    tbl: Table<T>,
    idPrefix: string,
    tableName?: 'shipment' | 'user' | 'share'
  ) {
    return {
      findUnique: vi.fn(async ({ where, include }: { where: Where; include?: Record<string, unknown> }) => {
        const r = resolveWhereUnique(tbl, where);
        if (!r) return null;
        return tableName ? includeRelations(r, tableName, include) : r;
      }),
      findFirst: vi.fn(async ({ where, include }: { where?: Where; include?: Record<string, unknown> } = {}) => {
        const r = tbl.rows.find((row) => matches(row, where ?? {}));
        if (!r) return null;
        return tableName ? includeRelations(r, tableName, include) : r;
      }),
      findMany: vi.fn(
        async ({
          where,
          include,
          orderBy: _orderBy,
          take: _take,
        }: {
          where?: Where;
          include?: Record<string, unknown>;
          orderBy?: unknown;
          take?: number;
        } = {}) => {
          const out = tbl.rows.filter((row) => matches(row, where ?? {}));
          return tableName ? out.map((r) => includeRelations(r, tableName, include)) : out;
        }
      ),
      create: vi.fn(async ({ data, include }: { data: Row; include?: Record<string, unknown> }) => {
        const id = (data['id'] as string | undefined) ?? genId(idPrefix, tbl.nextId++);
        const row: Row = {
          id,
          createdAt: data['createdAt'] ?? now(),
          updatedAt: data['updatedAt'] ?? now(),
          ...data,
        };
        tbl.rows.push(row as T);
        return tableName ? includeRelations(row, tableName, include) : row;
      }),
      update: vi.fn(
        async ({
          where,
          data,
          include,
        }: {
          where: Where;
          data: Row;
          include?: Record<string, unknown>;
        }) => {
          const r = resolveWhereUnique(tbl, where);
          if (!r) throw new Error('Record not found');
          Object.assign(r, data, { updatedAt: now() });
          return tableName ? includeRelations(r, tableName, include) : r;
        }
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: Where;
          create: Row;
          update: Row;
        }) => {
          const existing = resolveWhereUnique(tbl, where);
          if (existing) {
            Object.assign(existing, update, { updatedAt: now() });
            return existing;
          }
          const id = (create['id'] as string | undefined) ?? genId(idPrefix, tbl.nextId++);
          const row: Row = {
            id,
            createdAt: now(),
            updatedAt: now(),
            ...create,
          };
          tbl.rows.push(row as T);
          return row;
        }
      ),
      delete: vi.fn(async ({ where }: { where: Where }) => {
        const idx = tbl.rows.findIndex((r) => matches(r, where));
        if (idx < 0) throw new Error('Record not found');
        const [r] = tbl.rows.splice(idx, 1);
        return r;
      }),
      count: vi.fn(async ({ where }: { where?: Where } = {}) => {
        return tbl.rows.filter((row) => matches(row, where ?? {})).length;
      }),
      deleteMany: vi.fn(async ({ where }: { where?: Where } = {}) => {
        const before = tbl.rows.length;
        for (let i = tbl.rows.length - 1; i >= 0; i--) {
          const row = tbl.rows[i] as Row | undefined;
          if (row && matches(row, where ?? {})) tbl.rows.splice(i, 1);
        }
        return { count: before - tbl.rows.length };
      }),
      updateMany: vi.fn(
        async ({ where, data }: { where?: Where; data: Row }) => {
          let count = 0;
          for (const row of tbl.rows) {
            if (matches(row, where ?? {})) {
              Object.assign(row, data, { updatedAt: now() });
              count += 1;
            }
          }
          return { count };
        }
      ),
    };
  }

  const client = {
    user: mkCrud(users, 'user'),
    carrier: mkCrud(carriers, 'carrier'),
    shipment: mkCrud(shipments, 'shp', 'shipment'),
    trackingEvent: mkCrud(trackingEvents, 'evt'),
    notification: mkCrud(notifications, 'ntf'),
    webhookEvent: mkCrud(webhookEvents, 'whk'),
    shareLink: mkCrud(shareLinks, 'shl', 'share'),
    pushToken: mkCrud(pushTokens, 'tok'),
    $transaction: vi.fn(async (actions: unknown) => {
      if (typeof actions === 'function') {
        return (actions as (c: unknown) => Promise<unknown>)(client);
      }
      if (Array.isArray(actions)) {
        return Promise.all(actions);
      }
      return undefined;
    }),
    $disconnect: vi.fn(async () => undefined),
    _tables: {
      users,
      carriers,
      shipments,
      trackingEvents,
      notifications,
      webhookEvents,
      shareLinks,
      pushTokens,
    },
  };

  return client;
}

export type MockPrisma = ReturnType<typeof createPrismaMock>;
