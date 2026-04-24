import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

import { buildApp } from '../src/app.js';

async function main(): Promise<void> {
  const app = await buildApp();
  await app.ready();
  const spec = app.swagger();
  const out = join(process.cwd(), 'dist', 'openapi.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(spec, null, 2));
   
  console.log(`wrote ${out}`);
  await app.close();
  process.exit(0);
}

void main();
