#!/usr/bin/env node
/**
 * cli.ts — Content-lint CLI entry point
 *
 * Exits 1 if forbidden words found, 0 otherwise.
 * Run via: pnpm content:lint  (alias: pnpm --filter @relay/tools-content-lint lint)
 */

import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { walkDir, lintFiles, SCAN_DIRS } from './index.js';

/**
 * Walk up the directory tree from startDir until we find a directory
 * containing pnpm-workspace.yaml (the monorepo root).
 */
function findRepoRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break; // filesystem root
    dir = parent;
  }
  // Fallback: use cwd
  return process.cwd();
}

function main(): void {
  const thisFile = fileURLToPath(import.meta.url);
  const repoRoot = findRepoRoot(dirname(thisFile));

  const allFiles: string[] = [];
  for (const dir of SCAN_DIRS) {
    allFiles.push(...walkDir(join(repoRoot, dir)));
  }

  if (allFiles.length === 0) {
    console.log('[content-lint] No files found to scan.');
    process.exit(0);
  }

  const allViolations = lintFiles(allFiles, repoRoot);
  const errors = allViolations.filter((v) => v.level === 'error');
  const warnings = allViolations.filter((v) => v.level === 'warn');

  console.log(`\n[content-lint] Scanned ${allFiles.length} files\n`);

  if (errors.length > 0) {
    console.error('ERRORS — forbidden words found:');
    for (const v of errors) {
      console.error(`  ${v.file}:${v.line}:${v.col}  "${v.word}"  →  ${v.context}`);
    }
    console.error('');
  }

  if (warnings.length > 0) {
    console.warn('WARNINGS — excessive exclamation marks:');
    for (const v of warnings) {
      console.warn(`  ${v.file}:${v.line}:${v.col}  →  ${v.context}`);
    }
    console.warn('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('[content-lint] All clear — no tone violations found.\n');
    process.exit(0);
  }

  console.log(`[content-lint] ${errors.length} error(s), ${warnings.length} warning(s)\n`);
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
