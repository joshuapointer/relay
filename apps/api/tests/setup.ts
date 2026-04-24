import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { easypostHandlers } from './fixtures/easypost-msw.js';
import { DEFAULT_WEBHOOK_SECRET } from './fixtures/webhook-hmac.js';

process.env['EASYPOST_WEBHOOK_SECRET'] ??= DEFAULT_WEBHOOK_SECRET;

export const mswServer = setupServer(...easypostHandlers);

beforeAll(() => {
  mswServer.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(() => {
  mswServer.close();
});
