import type { PrismaClient } from '@prisma/client';

export interface LocalUser {
  id: string;
  clerkId: string;
  email: string;
}

/**
 * Finds a local User by `clerkId`, creating a row on first sight.
 * Idempotent; safe under race via Prisma upsert.
 */
export async function findOrCreateUser(
  prisma: PrismaClient,
  { clerkId, email }: { clerkId: string; email: string }
): Promise<LocalUser> {
  const row = await prisma.user.upsert({
    where: { clerkId },
    update: { email },
    create: { clerkId, email },
  });
  return { id: row.id, clerkId: row.clerkId, email: row.email };
}
