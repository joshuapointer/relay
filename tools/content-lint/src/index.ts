/**
 * content-lint — Relay tone-guide enforcement library
 *
 * Scans UI-facing source files for forbidden words and warns on
 * excessive exclamation marks in user-visible strings.
 *
 * Forbidden words (case-insensitive, whole-word):
 *   just, maybe, simply, sorry, unfortunately, oops, hmm, yay
 *
 * See tools/content-lint/README.md for rationale.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// ── Configuration ─────────────────────────────────────────────────────────────

export const FORBIDDEN_WORDS = [
  'just',
  'maybe',
  'simply',
  'sorry',
  'unfortunately',
  'oops',
  'hmm',
  'yay',
] as const;

export const SCAN_DIRS = [
  'apps/web/app',
  'apps/web/components',
  'apps/web/lib',
  'apps/mobile/app',
  'apps/mobile/components',
  'apps/mobile/constants',
  'apps/api/src/content',
];

const FILE_EXTENSIONS = new Set(['.ts', '.tsx']);

// Regex: word boundary on both sides, case-insensitive
function buildWordRegex(word: string): RegExp {
  return new RegExp(`\\b${word}\\b`, 'gi');
}

// Matches exclamation marks inside string literals
const EXCLAMATION_IN_STRING = /(['"`][^'"`\n]*![^'"`\n]*['"`])/g;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LintViolation {
  file: string;
  line: number;
  col: number;
  word: string;
  context: string;
  level: 'error' | 'warn';
}

// ── File walker ───────────────────────────────────────────────────────────────

export function walkDir(dir: string): string[] {
  let files: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      files = files.concat(walkDir(full));
    } else if (stat.isFile()) {
      const ext = full.slice(full.lastIndexOf('.'));
      if (FILE_EXTENSIONS.has(ext)) {
        files.push(full);
      }
    }
  }
  return files;
}

// ── Comment stripper ──────────────────────────────────────────────────────────

/**
 * Strip single-line (//) and multi-line (/* ... *\/) comments from source.
 * Replaces comment characters with spaces, preserving line/column positions.
 */
export function stripComments(source: string): string {
  const chars = source.split('');
  let i = 0;
  let inSingleLine = false;
  let inMultiLine = false;
  let inString: '"' | "'" | '`' | null = null;

  while (i < chars.length) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (inString) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === inString) {
        inString = null;
      }
      i++;
      continue;
    }

    if (inSingleLine) {
      if (ch === '\n') {
        inSingleLine = false;
      } else {
        chars[i] = ' ';
      }
      i++;
      continue;
    }

    if (inMultiLine) {
      if (ch === '*' && next === '/') {
        chars[i] = ' ';
        chars[i + 1] = ' ';
        i += 2;
        inMultiLine = false;
      } else if (ch !== '\n') {
        chars[i] = ' ';
        i++;
      } else {
        i++;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch as '"' | "'" | '`';
      i++;
      continue;
    }

    if (ch === '/' && next === '/') {
      chars[i] = ' ';
      chars[i + 1] = ' ';
      i += 2;
      inSingleLine = true;
      continue;
    }

    if (ch === '/' && next === '*') {
      chars[i] = ' ';
      chars[i + 1] = ' ';
      i += 2;
      inMultiLine = true;
      continue;
    }

    i++;
  }

  return chars.join('');
}

// ── JSX attribute name guard ──────────────────────────────────────────────────

function isHyphenated(line: string, col: number, word: string): boolean {
  const before = line[col - 1];
  const after = line[col + word.length];
  return before === '-' || after === '-';
}

// ── Linter ────────────────────────────────────────────────────────────────────

export function lintFile(filePath: string, repoRoot: string): LintViolation[] {
  let source: string;
  try {
    source = readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const violations: LintViolation[] = [];
  const stripped = stripComments(source);
  const strippedLines = stripped.split('\n');
  const originalLines = source.split('\n');

  // Build a set of line indices that have the disable directive
  const disabledLines = new Set<number>();
  for (let lineIdx = 0; lineIdx < originalLines.length; lineIdx++) {
    const origLine = originalLines[lineIdx] ?? '';
    if (origLine.includes('content-lint-disable-line')) {
      disabledLines.add(lineIdx);
    }
  }

  // Check forbidden words on comment-stripped source
  for (const word of FORBIDDEN_WORDS) {
    const regex = buildWordRegex(word);
    for (let lineIdx = 0; lineIdx < strippedLines.length; lineIdx++) {
      const line = strippedLines[lineIdx] ?? '';
      if (disabledLines.has(lineIdx)) continue;
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;
      while ((match = regex.exec(line)) !== null) {
        const col = match.index;
        if (isHyphenated(line, col, word)) continue;

        violations.push({
          file: relative(repoRoot, filePath),
          line: lineIdx + 1,
          col: col + 1,
          word: match[0],
          context: (originalLines[lineIdx] ?? '').trim(),
          level: 'error',
        });
      }
    }
  }

  // Warn on multiple exclamation marks in string literals (original source)
  for (let lineIdx = 0; lineIdx < originalLines.length; lineIdx++) {
    if (disabledLines.has(lineIdx)) continue;
    const line = originalLines[lineIdx] ?? '';
    let match: RegExpExecArray | null;
    EXCLAMATION_IN_STRING.lastIndex = 0;
    while ((match = EXCLAMATION_IN_STRING.exec(line)) !== null) {
      const str = match[1] ?? '';
      const excCount = (str.match(/!/g) ?? []).length;
      if (excCount > 1) {
        violations.push({
          file: relative(repoRoot, filePath),
          line: lineIdx + 1,
          col: match.index + 1,
          word: '!!',
          context: line.trim(),
          level: 'warn',
        });
      }
    }
  }

  return violations;
}

export function lintFiles(files: string[], repoRoot: string): LintViolation[] {
  const all: LintViolation[] = [];
  for (const f of files) {
    all.push(...lintFile(f, repoRoot));
  }
  return all;
}
