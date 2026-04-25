import type { FastifyInstance } from 'fastify';

export async function meRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/me',
    {
      preHandler: [app.authenticate],
      schema: { description: 'Get current user profile', tags: ['profile'] },
    },
    async (request, reply) => {
      const user = request.user;
      if (!user) return reply.status(401).send();
      const row = await app.prisma.user.findUnique({ where: { id: user.id } });
      if (!row) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found', traceId: request.id } });
      return reply.send({
        id: row.id,
        email: row.email,
        createdAt: row.createdAt.toISOString(),
      });
    }
  );

  app.delete(
    '/me',
    {
      preHandler: [app.authenticate],
      schema: { description: 'Delete current user account', tags: ['profile'] },
    },
    async (request, reply) => {
      const user = request.user;
      if (!user) return reply.status(401).send();
      await app.prisma.user.delete({ where: { id: user.id } });
      return reply.status(204).send();
    }
  );
}
