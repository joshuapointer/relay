import 'dotenv/config';
import { buildApp } from './app.js';
import { prisma } from './db/client.js';
import { attachSocketIo } from './realtime/io.js';

const PORT = Number(process.env['PORT'] ?? 4000);
const HOST = process.env['HOST'] ?? '0.0.0.0';

async function start(): Promise<void> {
  const app = await buildApp();

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down...`);
    try {
      await app.close();
      await prisma.$disconnect();
      app.log.info('Server closed');
      process.exit(0);
    } catch (err) {
      app.log.error(err, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await app.listen({ port: PORT, host: HOST });
    const mockMode = process.env['CLERK_MOCK_MODE'] === 'true';
    if (mockMode && process.env['NODE_ENV'] === 'production') {
      throw new Error('Refusing to start: CLERK_MOCK_MODE=true in production');
    }
    attachSocketIo(app, {
      mockMode,
      jwksUrl: process.env['CLERK_JWKS_URL'],
      issuer: process.env['CLERK_ISSUER'],
    });
  } catch (err) {
    app.log.error(err, 'Failed to start server');
    process.exit(1);
  }
}

void start();
