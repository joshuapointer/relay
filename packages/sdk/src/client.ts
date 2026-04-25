import { z } from 'zod';
import {
  ShipmentSchema,
  ShipmentDetailSchema,
  ShipmentListResponseSchema,
  NotificationSchema,
  PublicShipmentViewSchema,
  ApiErrorResponseSchema,
} from '@relay/shared-types';
import type {
  Shipment,
  ShipmentDetail,
  ShipmentListResponse,
  PublicShipmentView,
  CreateShipmentInput,
  UpdateShipmentInput,
  CreateShareLinkInput,
  UserProfile,
} from '@relay/shared-types';
import { UserProfileSchema } from '@relay/shared-types';
import {
  RelayAuthError,
  RelayClientError,
  RelayNetworkError,
  RelayValidationError,
} from './errors.js';

export interface RelayClientOptions {
  baseUrl: string;
  getAuthToken: () => Promise<string | null>;
}

const ShareLinkResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string().datetime(),
  url: z.string(),
});

type ShareLinkResponse = z.infer<typeof ShareLinkResponseSchema>;

const PushTokenResponseSchema = z.object({
  id: z.string(),
  token: z.string(),
  platform: z.string(),
  createdAt: z.string().datetime(),
});

type PushTokenResponse = z.infer<typeof PushTokenResponseSchema>;

const NotificationListResponseSchema = z.object({
  items: z.array(NotificationSchema),
  cursor: z.string().optional(),
});

type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

async function parseResponse<T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> {
  if (response.status === 401) {
    throw new RelayAuthError();
  }

  const body: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const parsed = ApiErrorResponseSchema.safeParse(body);
    if (parsed.success) {
      throw new RelayClientError(response.status, parsed.data.error);
    }
    throw new RelayClientError(response.status, {
      code: 'UNKNOWN_ERROR',
      message: `Request failed with status ${response.status}`,
    });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new RelayValidationError(
      'Response validation failed',
      result.error.issues,
    );
  }

  return result.data;
}

export interface RelayClient {
  shipments: {
    list(params?: { status?: string }): Promise<ShipmentListResponse>;
    get(id: string): Promise<ShipmentDetail>;
    create(input: CreateShipmentInput): Promise<Shipment>;
    update(id: string, input: UpdateShipmentInput): Promise<Shipment>;
    delete(id: string): Promise<void>;
    createShareLink(id: string, input?: CreateShareLinkInput): Promise<ShareLinkResponse>;
    refresh(id: string): Promise<ShipmentDetail>;
  };
  share: {
    get(token: string): Promise<PublicShipmentView>;
  };
  notifications: {
    list(params?: { unread?: boolean }): Promise<NotificationListResponse>;
    markRead(id: string): Promise<void>;
    markAllRead(): Promise<{ count: number }>;
  };
  pushTokens: {
    register(input: { token: string; platform: 'ios' | 'android' }): Promise<PushTokenResponse>;
    revoke(id: string): Promise<void>;
  };
  profile: {
    get(): Promise<UserProfile>;
    delete(): Promise<void>;
  };
}

export function createRelayClient(options: RelayClientOptions): RelayClient {
  const { baseUrl, getAuthToken } = options;

  async function request(
    method: string,
    path: string,
    body?: unknown,
    requiresAuth = true,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      let token: string | null;
      try {
        token = await getAuthToken();
      } catch (err) {
        throw new RelayNetworkError('Failed to retrieve auth token', err);
      }
      if (token !== null) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      return await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch (err) {
      throw new RelayNetworkError('Network request failed', err);
    }
  }

  return {
    shipments: {
      async list(params) {
        const qs = params?.status != null ? `?status=${encodeURIComponent(params.status)}` : '';
        const res = await request('GET', `/v1/shipments${qs}`);
        return parseResponse(res, ShipmentListResponseSchema);
      },

      async get(id) {
        const res = await request('GET', `/v1/shipments/${encodeURIComponent(id)}`);
        return parseResponse(res, ShipmentDetailSchema);
      },

      async create(input) {
        const res = await request('POST', '/v1/shipments', input);
        return parseResponse(res, ShipmentSchema);
      },

      async update(id, input) {
        const res = await request('PATCH', `/v1/shipments/${encodeURIComponent(id)}`, input);
        return parseResponse(res, ShipmentSchema);
      },

      async delete(id) {
        const res = await request('DELETE', `/v1/shipments/${encodeURIComponent(id)}`);
        if (res.status === 401) throw new RelayAuthError();
        if (!res.ok) {
          const body: unknown = await res.json().catch(() => ({}));
          const parsed = ApiErrorResponseSchema.safeParse(body);
          if (parsed.success) throw new RelayClientError(res.status, parsed.data.error);
          throw new RelayClientError(res.status, {
            code: 'UNKNOWN_ERROR',
            message: `Request failed with status ${res.status}`,
          });
        }
      },

      async createShareLink(id, input) {
        const res = await request(
          'POST',
          `/v1/shipments/${encodeURIComponent(id)}/share`,
          input ?? {},
        );
        return parseResponse(res, ShareLinkResponseSchema);
      },

      async refresh(id) {
        const res = await request('POST', `/v1/shipments/${encodeURIComponent(id)}/refresh`);
        return parseResponse(res, ShipmentDetailSchema);
      },
    },

    share: {
      async get(token) {
        const res = await request('GET', `/v1/share/${encodeURIComponent(token)}`, undefined, false);
        return parseResponse(res, PublicShipmentViewSchema);
      },
    },

    notifications: {
      async list(params) {
        const qs = params?.unread === true ? '?unread=true' : '';
        const res = await request('GET', `/v1/notifications${qs}`);
        return parseResponse(res, NotificationListResponseSchema);
      },

      async markRead(id) {
        const res = await request('POST', `/v1/notifications/${encodeURIComponent(id)}/read`);
        if (res.status === 401) throw new RelayAuthError();
        if (!res.ok) {
          const body: unknown = await res.json().catch(() => ({}));
          const parsed = ApiErrorResponseSchema.safeParse(body);
          if (parsed.success) throw new RelayClientError(res.status, parsed.data.error);
          throw new RelayClientError(res.status, {
            code: 'UNKNOWN_ERROR',
            message: `Request failed with status ${res.status}`,
          });
        }
      },

      async markAllRead() {
        const res = await request('POST', '/v1/notifications/read-all');
        return parseResponse(res, z.object({ count: z.number() }));
      },
    },

    pushTokens: {
      async register(input) {
        const res = await request('POST', '/v1/push-tokens', input);
        return parseResponse(res, PushTokenResponseSchema);
      },

      async revoke(id) {
        const res = await request('DELETE', `/v1/push-tokens/${encodeURIComponent(id)}`);
        if (res.status === 401) throw new RelayAuthError();
        if (!res.ok) {
          const body: unknown = await res.json().catch(() => ({}));
          const parsed = ApiErrorResponseSchema.safeParse(body);
          if (parsed.success) throw new RelayClientError(res.status, parsed.data.error);
          throw new RelayClientError(res.status, {
            code: 'UNKNOWN_ERROR',
            message: `Request failed with status ${res.status}`,
          });
        }
      },
    },

    profile: {
      async get() {
        const res = await request('GET', '/v1/me');
        return parseResponse(res, UserProfileSchema);
      },

      async delete() {
        const res = await request('DELETE', '/v1/me');
        if (res.status === 401) throw new RelayAuthError();
        if (!res.ok) {
          const body: unknown = await res.json().catch(() => ({}));
          const parsed = ApiErrorResponseSchema.safeParse(body);
          if (parsed.success) throw new RelayClientError(res.status, parsed.data.error);
          throw new RelayClientError(res.status, {
            code: 'UNKNOWN_ERROR',
            message: `Request failed with status ${res.status}`,
          });
        }
      },
    },
  };
}
