/**
 * WS-D-03c: Mobile font vendoring verification
 *
 * Asserts that all required TTF font files exist in apps/mobile/assets/fonts/
 * and have non-zero file sizes (i.e., are real font binaries, not placeholders).
 *
 * Run: pnpm --filter @relay/mobile test
 */

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MOBILE_FONTS = join(__dirname, '..', 'assets', 'fonts');

describe('Mobile font vendoring (WS-D-03c)', () => {
  const expectedTtfFiles = [
    'Poppins-Medium.ttf',
    'Poppins-SemiBold.ttf',
    'Poppins-Bold.ttf',
    'Inter-Regular.ttf',
    'Inter-Medium.ttf',
  ];

  for (const filename of expectedTtfFiles) {
    it(`${filename} exists and is non-empty`, () => {
      const filePath = join(MOBILE_FONTS, filename);
      expect(existsSync(filePath)).toBe(true);
      const stat = statSync(filePath);
      expect(stat.size).toBeGreaterThan(0);
    });
  }
});
