import { execSync } from 'child_process';
import { existsSync } from 'fs';

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config.
 *
 * To run tests against a live dev server:
 *   pnpm --filter @relay/web dev   # in one terminal
 *   pnpm --filter @relay/web test:e2e
 *
 * Tests automatically skip when the dev server is not available
 * (see individual spec files for skip guards).
 *
 * Both projects use Chromium (desktop and mobile-emulation) so only one
 * browser binary is required. WebKit is not used to avoid needing an
 * additional binary install in sandbox / CI environments.
 *
 * Browser availability is detected synchronously here so the env var
 * PLAYWRIGHT_BROWSERS_UNAVAILABLE is set before worker processes fork.
 */

// ---------------------------------------------------------------------------
// Detect Chromium binary availability synchronously.
// Workers inherit process.env from the main process at fork time, so setting
// it here (in the config module) is the correct place.
// ---------------------------------------------------------------------------

function detectChromiumBinary(): boolean {
  // Common Playwright chromium headless shell paths
  const candidates = [
    `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell`,
    `${process.env.HOME}/.cache/ms-playwright/chromium-1217/chrome-linux/chrome`,
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      // Binary exists — now check if it can actually load (probe shared libs)
      try {
        execSync(`ldd "${p}" 2>&1 | grep "not found"`, { stdio: 'pipe' });
        // If ldd found missing libs, grep exited 0 — binary won't work
        return false;
      } catch {
        // grep exit code 1 means no "not found" lines — binary should work
        return true;
      }
    }
  }
  return false;
}

function detectServerAvailability(): boolean {
  try {
    execSync('curl -sf --max-time 2 http://localhost:3000/ > /dev/null 2>&1', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

if (!detectChromiumBinary()) {
  process.env.PLAYWRIGHT_BROWSERS_UNAVAILABLE = 'true';
  console.warn(
    '[playwright.config] Chromium binary missing or has unmet system dependencies. ' +
    'All E2E tests will be skipped. ' +
    'To fix: pnpm --filter @relay/web exec playwright install --with-deps chromium',
  );
} else if (!detectServerAvailability()) {
  process.env.PLAYWRIGHT_SERVER_UNAVAILABLE = 'true';
  console.warn(
    '[playwright.config] Dev server not reachable at http://localhost:3000. ' +
    'All E2E tests will be skipped. ' +
    'To fix: pnpm --filter @relay/web dev',
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-iphone13',
      // Use Chromium with iPhone 13 device emulation (avoids WebKit binary requirement)
      use: { ...devices['iPhone 13'], ...{ browserName: 'chromium' } },
    },
  ],
});
