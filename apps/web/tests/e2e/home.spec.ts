/**
 * E2E smoke test — Landing page
 *
 * Requirements:
 *   - Relay wordmark is visible on the landing page
 *   - "Get started" CTA links to /sign-in
 *
 * How to run:
 *   1. Start the dev server:   pnpm --filter @relay/web dev
 *   2. Run tests:              pnpm --filter @relay/web test:e2e
 *
 * In CI / autopilot these tests are skipped when no server is reachable.
 * Set PLAYWRIGHT_BASE_URL to override the default localhost:3000.
 */

import { expect, test } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(({ }, testInfo) => {
    if (process.env.PLAYWRIGHT_BROWSERS_UNAVAILABLE === 'true') {
      testInfo.skip(true, 'Chromium has unmet system dependencies. Run: playwright install --with-deps chromium');
    }
    if (process.env.PLAYWRIGHT_SERVER_UNAVAILABLE === 'true') {
      testInfo.skip(true, 'Dev server not running at localhost:3000. Run: pnpm --filter @relay/web dev');
    }
  });

  test('shows the Relay wordmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/relay/i).first()).toBeVisible();
  });

  test('CTA links to /sign-in', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /get started/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/sign-in');
  });
});
