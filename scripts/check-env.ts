#!/usr/bin/env tsx
/**
 * check-env.ts — preflight environment variable validator
 *
 * Usage:
 *   tsx scripts/check-env.ts api
 *   tsx scripts/check-env.ts web
 *   tsx scripts/check-env.ts mobile
 *
 * Exits 0 in all cases (non-blocking warn).
 * In mock mode (CLERK_MOCK_MODE=true + EASYPOST_MOCK_MODE=true) missing
 * keys for those services are downgraded to info-level notices.
 */

interface EnvSpec {
  key: string;
  description: string;
  /** If true, the var is optional when its service mock is enabled */
  mockableBy?: 'clerk' | 'easypost';
  /** If true, missing in production is an error; missing in dev is a warning */
  requiredInProd: boolean;
}

const API_VARS: EnvSpec[] = [
  { key: 'DATABASE_URL', description: 'Postgres connection string', requiredInProd: true },
  { key: 'PORT', description: 'HTTP port (default 4000)', requiredInProd: false },
  { key: 'NODE_ENV', description: 'Node environment', requiredInProd: true },
  { key: 'CORS_ORIGIN', description: 'Allowed CORS origin', requiredInProd: true },
  { key: 'PUBLIC_BASE_URL', description: 'Base URL for share links', requiredInProd: true },
  { key: 'CLERK_SECRET_KEY', description: 'Clerk backend secret key', requiredInProd: true, mockableBy: 'clerk' },
  { key: 'CLERK_PUBLISHABLE_KEY', description: 'Clerk publishable key', requiredInProd: true, mockableBy: 'clerk' },
  { key: 'CLERK_JWKS_URL', description: 'Clerk JWKS endpoint URL', requiredInProd: true, mockableBy: 'clerk' },
  { key: 'CLERK_ISSUER', description: 'Clerk issuer URL', requiredInProd: true, mockableBy: 'clerk' },
  { key: 'EASYPOST_API_KEY', description: 'EasyPost API key', requiredInProd: true, mockableBy: 'easypost' },
  { key: 'EASYPOST_WEBHOOK_SECRET', description: 'EasyPost webhook HMAC secret', requiredInProd: true, mockableBy: 'easypost' },
  { key: 'EXPO_ACCESS_TOKEN', description: 'Expo push notification token', requiredInProd: true },
  { key: 'SOCKET_IO_REDIS_URL', description: 'Redis connection string for Socket.IO', requiredInProd: true },
  { key: 'SENTRY_DSN', description: 'Sentry DSN (optional)', requiredInProd: false },
];

const WEB_VARS: EnvSpec[] = [
  { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', description: 'Clerk publishable key (public)', requiredInProd: true, mockableBy: 'clerk' },
  { key: 'CLERK_SECRET_KEY', description: 'Clerk backend secret key', requiredInProd: true, mockableBy: 'clerk' },
  { key: 'NEXT_PUBLIC_API_URL', description: 'API base URL', requiredInProd: true },
  { key: 'NEXT_PUBLIC_WS_URL', description: 'WebSocket URL', requiredInProd: true },
  { key: 'NEXT_PUBLIC_CLERK_MOCK_MODE', description: 'Mock Clerk (dev only)', requiredInProd: false },
];

const MOBILE_VARS: EnvSpec[] = [
  { key: 'CLERK_PUBLISHABLE_KEY', description: 'Clerk publishable key', requiredInProd: true, mockableBy: 'clerk' },
  { key: 'EXPO_PUBLIC_API_URL', description: 'API base URL', requiredInProd: true },
  { key: 'EXPO_PUBLIC_WS_URL', description: 'WebSocket URL', requiredInProd: true },
  { key: 'CLERK_MOCK_MODE', description: 'Mock Clerk (dev only)', requiredInProd: false },
];

const TARGETS: Record<string, EnvSpec[]> = {
  api: API_VARS,
  web: WEB_VARS,
  mobile: MOBILE_VARS,
};

function main(): void {
  const target = process.argv[2];

  if (!target || !TARGETS[target]) {
    console.error(`Usage: tsx scripts/check-env.ts <api|web|mobile>`);
    console.error(`Available targets: ${Object.keys(TARGETS).join(', ')}`);
    process.exit(0); // non-blocking
  }

  const vars = TARGETS[target];
  const isProduction = process.env['NODE_ENV'] === 'production';
  const clerkMock = process.env['CLERK_MOCK_MODE'] === 'true' || process.env['NEXT_PUBLIC_CLERK_MOCK_MODE'] === 'true';
  const easypostMock = process.env['EASYPOST_MOCK_MODE'] === 'true';

  const missing: Array<{ spec: EnvSpec; level: 'warn' | 'info' }> = [];
  const present: string[] = [];

  for (const spec of vars) {
    const value = process.env[spec.key];
    if (value && value.trim() !== '') {
      present.push(spec.key);
      continue;
    }

    // Determine severity
    let level: 'warn' | 'info' = 'warn';

    if (spec.mockableBy === 'clerk' && clerkMock) {
      level = 'info';
    } else if (spec.mockableBy === 'easypost' && easypostMock) {
      level = 'info';
    } else if (!spec.requiredInProd) {
      level = 'info';
    }

    missing.push({ spec, level });
  }

  const header = `\n[check-env] Target: ${target} | NODE_ENV: ${process.env['NODE_ENV'] ?? 'unset'} | Mock: clerk=${clerkMock} easypost=${easypostMock}\n`;
  console.log(header);

  if (present.length > 0) {
    console.log(`  OK (${present.length} vars set):`);
    for (const key of present) {
      console.log(`    ✓ ${key}`);
    }
  }

  if (missing.length === 0) {
    console.log('\n  All required environment variables are set.\n');
    process.exit(0);
  }

  const warns = missing.filter((m) => m.level === 'warn');
  const infos = missing.filter((m) => m.level === 'info');

  if (warns.length > 0) {
    console.log(`\n  WARN — missing (will fail in production):`);
    for (const { spec } of warns) {
      console.log(`    ! ${spec.key} — ${spec.description}`);
    }
  }

  if (infos.length > 0) {
    console.log(`\n  INFO — optional / mocked:`);
    for (const { spec } of infos) {
      const mockNote = spec.mockableBy ? ` (mocked by ${spec.mockableBy} mock)` : '';
      console.log(`    - ${spec.key} — ${spec.description}${mockNote}`);
    }
  }

  if (isProduction && warns.length > 0) {
    console.error(`\n  ERROR: ${warns.length} required variable(s) missing in production mode.\n`);
    // Still exit 0 — non-blocking by design; CI uses this as a warning gate only
  }

  console.log('');
  process.exit(0);
}

main();
