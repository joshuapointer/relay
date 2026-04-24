import { z } from 'zod';

export const NotificationTypeSchema = z.enum([
  'STATUS_CHANGE',
  'DELAY',
  'EXCEPTION',
  'DELIVERED',
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  shipmentId: z.string().nullable(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  readAt: z.string().datetime().nullable(),
  sentAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationListResponseSchema = z.object({
  items: z.array(NotificationSchema),
  cursor: z.string().optional(),
});

export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

export const NotificationCopySchema = z.object({
  type: NotificationTypeSchema,
  title: z.string(),
  bodyTemplate: z.string(),
});

export type NotificationCopy = z.infer<typeof NotificationCopySchema>;

export const NotificationCatalogSchema = z.record(
  NotificationTypeSchema,
  NotificationCopySchema,
);

export type NotificationCatalog = z.infer<typeof NotificationCatalogSchema>;
