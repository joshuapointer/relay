/**
 * WS-D-03c: Font vendoring verification
 *
 * Asserts that all required woff2 font files exist at the expected paths
 * and have non-zero file sizes (i.e., are real font binaries, not placeholders).
 *
 * Run: pnpm --filter @relay/web test
 */

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

// __dirname = apps/web/src/__tests__ — go up 2 to reach apps/web/, then into public/fonts
const WEB_PUBLIC_FONTS = join(__dirname, '..', '..', 'public', 'fonts');

describe('Web font vendoring (WS-D-03c)', () => {
  const expectedWoff2Files = [
    'Poppins-Medium.woff2',
    'Poppins-SemiBold.woff2',
    'Poppins-Bold.woff2',
    'Inter-Regular.woff2',
    'Inter-Medium.woff2',
  ];

  for (const filename of expectedWoff2Files) {
    it(`${filename} exists and is non-empty`, () => {
      const filePath = join(WEB_PUBLIC_FONTS, filename);
      expect(existsSync(filePath), `${filename} should exist at ${filePath}`).toBe(true);
      const stat = statSync(filePath);
      expect(stat.size, `${filename} should have size > 0`).toBeGreaterThan(0);
    });
  }

  it('LICENSE.txt exists', () => {
    const licensePath = join(WEB_PUBLIC_FONTS, 'LICENSE.txt');
    expect(existsSync(licensePath)).toBe(true);
    const stat = statSync(licensePath);
    expect(stat.size).toBeGreaterThan(0);
  });
});
