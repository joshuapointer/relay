/**
 * Playwright global setup — probes browser and server availability.
 *
 * Sets process.env.PLAYWRIGHT_SKIP_TESTS=true when:
 *   - The Chromium binary fails to launch (missing system libs in sandbox), OR
 *   - The dev server is not reachable at localhost:3000
 *
 * Individual spec files read this env var in beforeEach to skip gracefully
 * without requiring a browser launch first.
 */

import { chromium } from '@playwright/test';

export default async function globalSetup(): Promise<void> {
  // Probe browser launch
  let browserAvailable = false;
  try {
    const browser = await chromium.launch();
    await browser.close();
    browserAvailable = true;
  } catch {
    browserAvailable = false;
    console.warn(
      '[global-setup] Chromium launch failed (missing system libs or binary). ' +
      'All E2E tests will be skipped. ' +
      'Install dependencies with: pnpm --filter @relay/web exec playwright install --with-deps chromium',
    );
  }

  if (!browserAvailable) {
    process.env.PLAYWRIGHT_BROWSERS_UNAVAILABLE = 'true';
    return;
  }

  // Probe dev server
  let serverAvailable = false;
  try {
    const res = await fetch('http://localhost:3000/');
    serverAvailable = res.status < 500;
  } catch {
    serverAvailable = false;
  }

  if (!serverAvailable) {
    process.env.PLAYWRIGHT_SERVER_UNAVAILABLE = 'true';
    console.warn(
      '[global-setup] Dev server not reachable at http://localhost:3000. ' +
      'All E2E tests will be skipped. ' +
      'Start the server with: pnpm --filter @relay/web dev',
    );
  }
}
