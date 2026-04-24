/**
 * WS-D-04 Brand Acceptance — Visual Regression (Screenshot) Tests
 *
 * Tests the 3 required mockups from §5.5 of the requirements spec:
 *   1. Mobile home screen (/dashboard at iPhone 13 viewport)
 *   2. Web tracking page (/shipments/fixture-1 at desktop viewport)
 *   3. Landing page (/ at desktop viewport)
 *
 * How to run:
 *   pnpm --filter @relay/web dev                          # terminal 1
 *   pnpm --filter @relay/web test:e2e                     # terminal 2 — compare baselines
 *   pnpm --filter @relay/web test:e2e:update-snapshots    # regenerate baselines
 *
 * Environment:
 *   Auth runs through NextAuth (Authentik) — see middleware.ts for protected routes.
 *   API routes are intercepted via seedShipment() so no backend is required.
 *
 * Baseline screenshots live in tests/e2e/__screenshots__/ and are git-committed.
 * First run generates baselines automatically; subsequent runs compare.
 *
 * Sandbox / CI note: tests skip automatically when browsers are not launchable
 * or when the dev server is not running. playwright.config.ts sets env vars
 * (PLAYWRIGHT_BROWSERS_UNAVAILABLE / PLAYWRIGHT_SERVER_UNAVAILABLE) that
 * beforeEach reads via testInfo.skip() — the correct Playwright skip API.
 */

import { expect, test } from '@playwright/test';

import { seedShipment, FIXTURE_SHIPMENT } from './fixtures/seedShipment';

// ---------------------------------------------------------------------------
// Shared beforeEach skip guard — uses testInfo.skip() which is the correct
// Playwright API for skipping from within beforeEach hooks.
// ---------------------------------------------------------------------------

function addSkipGuard() {
  // TODO: Remove skip once browser system deps are installed and dev server is running.
  // Install deps: pnpm --filter @relay/web exec playwright install --with-deps chromium
  // Start server:  pnpm --filter @relay/web dev
  test.beforeEach(({ }, testInfo) => {
    if (process.env.PLAYWRIGHT_BROWSERS_UNAVAILABLE === 'true') {
      testInfo.skip(true, 'Chromium has unmet system dependencies in this environment. Run: playwright install --with-deps chromium');
    }
    if (process.env.PLAYWRIGHT_SERVER_UNAVAILABLE === 'true') {
      testInfo.skip(true, 'Dev server not running at localhost:3000. Run: pnpm --filter @relay/web dev');
    }
  });
}

// ---------------------------------------------------------------------------
// Test 1: Mobile home screen — /dashboard at iPhone 13 viewport
// ---------------------------------------------------------------------------

test.describe('Mockup: Mobile home screen', () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 13 dimensions
  });

  addSkipGuard();

  test('mobile-home screenshot matches baseline', async ({ page }) => {
    // Seed fixture shipment so dashboard renders populated state
    await seedShipment(page, FIXTURE_SHIPMENT);

    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Wait for primary content to paint before snapshotting
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('mobile-home.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

// ---------------------------------------------------------------------------
// Test 2: Web tracking page — /shipments/fixture-1 at desktop viewport
// ---------------------------------------------------------------------------

test.describe('Mockup: Web tracking page', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
  });

  addSkipGuard();

  test('web-tracking-page screenshot matches baseline', async ({ page }) => {
    // Intercept API so shipment detail renders without a real backend
    await seedShipment(page, FIXTURE_SHIPMENT);

    await page.goto('/shipments/fixture-1', { waitUntil: 'networkidle' });

    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('web-tracking-page.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

// ---------------------------------------------------------------------------
// Test 3: Landing page — / at desktop viewport
// ---------------------------------------------------------------------------

test.describe('Mockup: Landing page', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
  });

  addSkipGuard();

  test('landing screenshot matches baseline', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('landing.png');
  });
});
