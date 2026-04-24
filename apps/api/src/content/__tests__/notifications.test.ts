import { describe, it, expect } from 'vitest';

import {
  NOTIFICATIONS,
  ALL_TRANSITIONS,
  FORBIDDEN_WORDS,
  getCopyForTransition,
  type NotificationCopy,
} from '../notifications.js';

describe('notifications.catalog', () => {
  it('has an entry for every ALL_TRANSITIONS tuple', () => {
    for (const [from, to] of ALL_TRANSITIONS) {
      const key = `${from}->${to}`;
      expect(
        (NOTIFICATIONS as Record<string, NotificationCopy>)[key],
        `missing transition ${key}`
      ).toBeTruthy();
    }
  });

  it('covers at least 15 meaningful transitions', () => {
    expect(ALL_TRANSITIONS.length).toBeGreaterThanOrEqual(15);
  });

  it('title <= 60 chars and body <= 120 chars', () => {
    for (const entry of Object.values(NOTIFICATIONS) as NotificationCopy[]) {
      expect(entry.title.length, `title="${entry.title}"`).toBeGreaterThan(0);
      expect(entry.title.length, `title="${entry.title}"`).toBeLessThanOrEqual(60);
      expect(entry.body.length, `body="${entry.body}"`).toBeGreaterThan(0);
      expect(entry.body.length, `body="${entry.body}"`).toBeLessThanOrEqual(120);
    }
  });

  it('contains no forbidden words (case-insensitive)', () => {
    const entries = Object.entries(NOTIFICATIONS) as Array<[string, NotificationCopy]>;
    for (const [key, entry] of entries) {
      const haystack = `${entry.title} ${entry.body}`.toLowerCase();
      for (const word of FORBIDDEN_WORDS) {
        const re = new RegExp(`\\b${word}\\b`, 'i');
        expect(re.test(haystack), `"${word}" found in ${key}`).toBe(false);
      }
    }
  });

  it('uses no exclamation marks', () => {
    for (const [key, entry] of Object.entries(NOTIFICATIONS) as Array<
      [string, NotificationCopy]
    >) {
      expect(entry.title.includes('!'), `! in title for ${key}`).toBe(false);
      expect(entry.body.includes('!'), `! in body for ${key}`).toBe(false);
    }
  });

  it('getCopyForTransition returns fallback for unknown pair', () => {
    const copy = getCopyForTransition('Delivered', 'Pending');
    expect(copy.title.length).toBeGreaterThan(0);
    expect(copy.body.length).toBeGreaterThan(0);
  });

  it('getCopyForTransition injects ETA for exception transitions when provided', () => {
    const copy = getCopyForTransition('In Transit', 'Exception', {
      eta: new Date('2025-12-31T00:00:00Z'),
    });
    expect(copy.body).toMatch(/2025-12-31/);
    expect(copy.body.length).toBeLessThanOrEqual(120);
  });

  it('regression guard: deleting an entry breaks the suite', () => {
    // If an entry is removed, the first test fails. Snapshot key count here.
    expect(Object.keys(NOTIFICATIONS).length).toBeGreaterThanOrEqual(15);
  });
});
