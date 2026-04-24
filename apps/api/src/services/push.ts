import type { PrismaClient, NotificationType } from '@prisma/client';

export interface PushEnqueueInput {
  userId: string;
  shipmentId: string;
  type: NotificationType;
  title: string;
  body: string;
}

export async function enqueuePushNotification(
  prisma: PrismaClient,
  input: PushEnqueueInput
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      shipmentId: input.shipmentId,
      type: input.type,
      status: 'PENDING',
      title: input.title,
      body: input.body,
      payload: {
        title: input.title,
        body: input.body,
      },
    },
  });

  const token = process.env['EXPO_ACCESS_TOKEN'];
  if (!token) {
    return;
  }

  try {
    const { Expo } = await import('expo-server-sdk');
    const expo = new Expo({ accessToken: token });
    const tokens = (await prisma.pushToken.findMany({
      where: { userId: input.userId, revokedAt: null },
    })) as Array<{ token: string }>;
    const messages = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title: input.title,
        body: input.body,
        data: { shipmentId: input.shipmentId, type: input.type },
      }));
    if (messages.length > 0) {
      await expo.sendPushNotificationsAsync(messages);
    }
  } catch {
    // best-effort push; catalog+notification row persisted either way
  }
}
