import type { InternalShipmentStatus } from '../../schemas/status.js';

import { mapEasyPostStatus } from './statusMap.js';

export interface NormalizedTrackingEvent {
  occurredAt: Date;
  status: InternalShipmentStatus;
  description: string;
  location: string | null;
  raw: unknown;
}

export interface NormalizedTracker {
  providerTrackerId: string;
  carrierCode: string;
  status: InternalShipmentStatus;
  lastEventAt: Date | null;
  eta: Date | null;
  events: NormalizedTrackingEvent[];
}

export interface CreateTrackerInput {
  trackingCode: string;
  carrierCode?: string;
}

const EASYPOST_API = 'https://api.easypost.com/v2';

type EasyPostEvent = {
  datetime?: string;
  status?: string;
  message?: string;
  description?: string;
  tracking_location?: {
    city?: string | null;
    state?: string | null;
    country?: string | null;
  } | null;
};

type EasyPostTracker = {
  id: string;
  status?: string;
  carrier?: string;
  est_delivery_date?: string | null;
  updated_at?: string | null;
  tracking_details?: EasyPostEvent[];
};

/**
 * Small circuit-breaker: flips `open` after 5 consecutive failures and stays
 * open for `cooldownMs`. `shouldTryCall()` returns false while open.
 */
export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;
  constructor(
    private readonly threshold = 5,
    private readonly cooldownMs = 30_000
  ) {}

  get isOpen(): boolean {
    if (this.openedAt === null) return false;
    if (Date.now() - this.openedAt > this.cooldownMs) {
      this.reset();
      return false;
    }
    return true;
  }

  success(): void {
    this.failures = 0;
    this.openedAt = null;
  }

  fail(): void {
    this.failures += 1;
    if (this.failures >= this.threshold) {
      this.openedAt = Date.now();
    }
  }

  reset(): void {
    this.failures = 0;
    this.openedAt = null;
  }

  get state(): { open: boolean; failures: number } {
    return { open: this.isOpen, failures: this.failures };
  }
}

export class EasyPostAdapter {
  public readonly breaker = new CircuitBreaker();

  constructor(
    private readonly apiKey = process.env['EASYPOST_API_KEY'] ?? '',
    private readonly fetchImpl: typeof fetch = globalThis.fetch
  ) {}

  get isLive(): boolean {
    return this.apiKey.length > 0;
  }

  private normalize(t: EasyPostTracker): NormalizedTracker {
    const events: NormalizedTrackingEvent[] = (t.tracking_details ?? []).map((d) => ({
      occurredAt: d.datetime ? new Date(d.datetime) : new Date(),
      status: mapEasyPostStatus(d.status),
      description: d.message ?? d.description ?? '',
      location: [d.tracking_location?.city, d.tracking_location?.state]
        .filter(Boolean)
        .join(', ') || null,
      raw: d,
    }));

    const lastEventAt = events.length
      ? events.reduce(
          (max, e) => (e.occurredAt > max ? e.occurredAt : max),
          events[0]!.occurredAt
        )
      : t.updated_at
        ? new Date(t.updated_at)
        : null;

    return {
      providerTrackerId: t.id,
      carrierCode: (t.carrier ?? 'UNKNOWN').toUpperCase(),
      status: mapEasyPostStatus(t.status),
      lastEventAt,
      eta: t.est_delivery_date ? new Date(t.est_delivery_date) : null,
      events,
    };
  }

  private synthTracker(
    trackingCode: string,
    carrierCode: string | undefined,
  ): NormalizedTracker {
    const code = carrierCode && carrierCode.trim().length > 0 ? carrierCode : 'USPS';
    return {
      providerTrackerId: `mock_${trackingCode}`,
      carrierCode: code.toUpperCase(),
      status: 'PENDING',
      lastEventAt: null,
      eta: null,
      events: [],
    };
  }

  private headers(): HeadersInit {
    const key = this.apiKey;
    if (!key && process.env['NODE_ENV'] === 'production') {
      throw new Error('EASYPOST_API_KEY not configured');
    }
    const auth = Buffer.from(`${key || 'test-key'}:`).toString('base64');
    return {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  async createTracker(input: CreateTrackerInput): Promise<NormalizedTracker> {
    if (this.breaker.isOpen) {
      throw new AdapterCircuitOpenError();
    }
    if (!this.isLive) {
      return this.synthTracker(input.trackingCode, input.carrierCode);
    }
    try {
      const res = await this.fetchImpl(`${EASYPOST_API}/trackers`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          tracker: {
            tracking_code: input.trackingCode,
            ...(input.carrierCode ? { carrier: input.carrierCode } : {}),
          },
        }),
      });
      if (!res.ok) {
        this.breaker.fail();
        throw new AdapterError(
          `easypost ${res.status}`,
          res.status === 404 ? 'CARRIER_NOT_FOUND' : 'UPSTREAM_ERROR'
        );
      }
      const body = (await res.json()) as { tracker: EasyPostTracker } | EasyPostTracker;
      const tracker = 'tracker' in body ? body.tracker : body;
      this.breaker.success();
      return this.normalize(tracker);
    } catch (err) {
      if (err instanceof AdapterError) throw err;
      this.breaker.fail();
      throw new AdapterError((err as Error).message ?? 'easypost network error');
    }
  }

  async getTracker(providerTrackerId: string): Promise<NormalizedTracker> {
    if (this.breaker.isOpen) throw new AdapterCircuitOpenError();
    if (!this.isLive) {
      return this.synthTracker(providerTrackerId, undefined);
    }
    try {
      const res = await this.fetchImpl(`${EASYPOST_API}/trackers/${providerTrackerId}`, {
        headers: this.headers(),
      });
      if (!res.ok) {
        this.breaker.fail();
        throw new AdapterError(`easypost ${res.status}`);
      }
      const body = (await res.json()) as { tracker: EasyPostTracker } | EasyPostTracker;
      const tracker = 'tracker' in body ? body.tracker : body;
      this.breaker.success();
      return this.normalize(tracker);
    } catch (err) {
      if (err instanceof AdapterError) throw err;
      this.breaker.fail();
      throw new AdapterError((err as Error).message ?? 'easypost network error');
    }
  }

  async refreshTracker(providerTrackerId: string): Promise<NormalizedTracker> {
    if (this.breaker.isOpen) throw new AdapterCircuitOpenError();
    if (!this.isLive) {
      return this.synthTracker(providerTrackerId, undefined);
    }
    try {
      const res = await this.fetchImpl(
        `${EASYPOST_API}/trackers/${providerTrackerId}/refresh`,
        {
          method: 'POST',
          headers: this.headers(),
        }
      );
      if (!res.ok) {
        // refresh isn't a real endpoint everywhere — fall back to GET
        return this.getTracker(providerTrackerId);
      }
      const body = (await res.json()) as { tracker: EasyPostTracker } | EasyPostTracker;
      const tracker = 'tracker' in body ? body.tracker : body;
      this.breaker.success();
      return this.normalize(tracker);
    } catch (err) {
      if (err instanceof AdapterError) throw err;
      this.breaker.fail();
      throw new AdapterError((err as Error).message ?? 'easypost network error');
    }
  }
}

export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly code: 'UPSTREAM_ERROR' | 'CARRIER_NOT_FOUND' | 'NETWORK' = 'UPSTREAM_ERROR'
  ) {
    super(message);
  }
}

export class AdapterCircuitOpenError extends Error {
  public readonly code = 'CIRCUIT_OPEN';
  constructor() {
    super('EasyPost adapter circuit is open');
  }
}

let _defaultAdapter: EasyPostAdapter | null = null;
export function getEasyPostAdapter(): EasyPostAdapter {
  if (!_defaultAdapter) _defaultAdapter = new EasyPostAdapter();
  return _defaultAdapter;
}
export function setEasyPostAdapter(adapter: EasyPostAdapter | null): void {
  _defaultAdapter = adapter;
}
