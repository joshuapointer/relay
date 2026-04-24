import { describe, it, expect } from 'vitest';
import { lintFile, stripComments, FORBIDDEN_WORDS } from '../index.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTempFile(content: string, ext = '.tsx'): string {
  const dir = join(tmpdir(), `content-lint-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `test${ext}`);
  writeFileSync(file, content, 'utf8');
  return file;
}

// ── stripComments ─────────────────────────────────────────────────────────────

describe('stripComments', () => {
  it('strips single-line comments', () => {
    const src = `const x = 1; // just a comment\nconst y = 2;`;
    const stripped = stripComments(src);
    // "just" in comment should be blanked out
    expect(stripped).not.toContain('just a comment');
    expect(stripped).toContain('const x = 1;');
    expect(stripped).toContain('const y = 2;');
  });

  it('strips multi-line comments', () => {
    const src = `/* just ignore this\n   sorry about that */\nconst z = 3;`;
    const stripped = stripComments(src);
    expect(stripped).not.toContain('sorry');
    expect(stripped).toContain('const z = 3;');
  });

  it('preserves strings inside single-line comments context', () => {
    const src = `const msg = "Sign in"; // just placeholder`;
    const stripped = stripComments(src);
    expect(stripped).toContain('"Sign in"');
    expect(stripped).not.toContain('just placeholder');
  });

  it('preserves newlines so line numbers stay accurate', () => {
    const src = `line1\n// just\nline3`;
    const stripped = stripComments(src);
    expect(stripped.split('\n')).toHaveLength(3);
  });
});

// ── lintFile — forbidden words ────────────────────────────────────────────────

describe('lintFile — forbidden words', () => {
  it('detects a forbidden word in a string literal', () => {
    const file = makeTempFile(`export const msg = "Just sign in to continue";`);
    const violations = lintFile(file, tmpdir());
    const errors = violations.filter((v) => v.level === 'error');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.word.toLowerCase()).toBe('just');
  });

  it('detects all forbidden words', () => {
    const content = FORBIDDEN_WORDS.map(
      (w) => `export const a${w} = "${w} do it";`
    ).join('\n');
    const file = makeTempFile(content);
    const violations = lintFile(file, tmpdir()).filter((v) => v.level === 'error');
    // Each forbidden word appears once in a string
    expect(violations.length).toBeGreaterThanOrEqual(FORBIDDEN_WORDS.length);
  });

  it('ignores forbidden word inside a single-line comment', () => {
    const file = makeTempFile(`const x = 1; // just a note\nconst msg = "Sign in";`);
    const violations = lintFile(file, tmpdir()).filter((v) => v.level === 'error');
    expect(violations).toHaveLength(0);
  });

  it('ignores forbidden word inside a block comment', () => {
    const file = makeTempFile(`/* simply ignore */\nexport const msg = "Track shipment";`);
    const violations = lintFile(file, tmpdir()).filter((v) => v.level === 'error');
    expect(violations).toHaveLength(0);
  });

  it('ignores "justify-content" CSS class (JSX attribute name context)', () => {
    const file = makeTempFile(`export const el = <div className="flex justify-content-center" />;`);
    const violations = lintFile(file, tmpdir()).filter((v) => v.level === 'error' && v.word.toLowerCase() === 'just');
    // "justify" contains "just" but is hyphenated — should be ignored
    // Note: the regex uses word boundary so "justify" won't match "just" anyway
    expect(violations).toHaveLength(0);
  });

  it('is case-insensitive for forbidden words', () => {
    const file = makeTempFile(`export const msg = "JUST click here";`);
    const violations = lintFile(file, tmpdir()).filter((v) => v.level === 'error');
    expect(violations).toHaveLength(1);
  });

  it('reports correct line and column', () => {
    const file = makeTempFile(`const a = 1;\nexport const msg = "sorry about that";`);
    const violations = lintFile(file, tmpdir()).filter((v) => v.level === 'error');
    expect(violations).toHaveLength(1);
    expect(violations[0]!.line).toBe(2);
    expect(violations[0]!.col).toBeGreaterThan(0);
  });

  it('returns no violations for clean content', () => {
    const file = makeTempFile(`export const msg = "Track your shipment";`);
    const violations = lintFile(file, tmpdir()).filter((v) => v.level === 'error');
    expect(violations).toHaveLength(0);
  });
});

// ── lintFile — exclamation mark warnings ─────────────────────────────────────

describe('lintFile — exclamation warnings', () => {
  it('warns on more than one exclamation mark in a string', () => {
    const file = makeTempFile(`export const msg = "Delivered!! Great news";`);
    const violations = lintFile(file, tmpdir()).filter((v) => v.level === 'warn');
    expect(violations).toHaveLength(1);
  });

  it('does not warn on a single exclamation mark', () => {
    const file = makeTempFile(`export const msg = "Delivered!";`);
    const violations = lintFile(file, tmpdir()).filter((v) => v.level === 'warn');
    expect(violations).toHaveLength(0);
  });
});
