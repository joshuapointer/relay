/**
 * Relay launcher icon generator
 *
 * Reads icon-light.svg and composites it onto brand backgrounds to produce
 * all required launcher PNGs for Expo (iOS, Android, splash, favicon) and
 * web (favicon.ico equivalent PNGs, PWA icons, apple-touch-icon).
 *
 * Run: pnpm --filter @relay/tools-launcher-gen gen
 * Re-run whenever packages/ui-core/src/brand/assets/icon-light.svg changes.
 *
 * Deterministic: same SVG input → byte-identical PNG output.
 * sharp settings: no metadata embed, no timestamps, consistent Lanczos kernel.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
// __dirname at runtime = tools/launcher-gen/dist — 3 levels up reaches repo root
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SVG_PATH = path.join(
  REPO_ROOT,
  'packages/ui-core/src/brand/assets/icon-light.svg'
);

const MOBILE_ASSETS = path.join(REPO_ROOT, 'apps/mobile/assets');
const WEB_APP = path.join(REPO_ROOT, 'apps/web/app');
const WEB_PUBLIC = path.join(REPO_ROOT, 'apps/web/public');

// Brand colors
const DEEP_TECH_BLUE = { r: 0, g: 59, b: 115, alpha: 1 } as const;

// ---------------------------------------------------------------------------
// Output spec
// ---------------------------------------------------------------------------
interface OutputSpec {
  dest: string;
  width: number;
  height: number;
  /** Composite the icon SVG; if false, emit solid blue tile (bg-only layer) */
  compositeIcon: boolean;
  /** Scale factor: icon occupies this fraction of the shortest dimension */
  iconScale: number;
  /** Background color – defaults to DEEP_TECH_BLUE; null = transparent */
  background: sharp.Color | null;
}

const OUTPUTS: OutputSpec[] = [
  // --- Expo / mobile ---
  {
    dest: path.join(MOBILE_ASSETS, 'icon.png'),
    width: 1024,
    height: 1024,
    compositeIcon: true,
    iconScale: 0.6,
    background: '#003B73',
  },
  {
    dest: path.join(MOBILE_ASSETS, 'adaptive-icon.png'),
    width: 1024,
    height: 1024,
    compositeIcon: true,
    iconScale: 0.6,
    background: null, // transparent – Android supplies its own background layer
  },
  {
    dest: path.join(MOBILE_ASSETS, 'splash.png'),
    width: 1242,
    height: 2436,
    compositeIcon: true,
    iconScale: 0.35,
    background: '#003B73',
  },
  {
    dest: path.join(MOBILE_ASSETS, 'favicon.png'),
    width: 48,
    height: 48,
    compositeIcon: true,
    iconScale: 0.6,
    background: '#003B73',
  },

  // --- Web PWA / favicons ---
  {
    dest: path.join(WEB_PUBLIC, 'icon-192.png'),
    width: 192,
    height: 192,
    compositeIcon: true,
    iconScale: 0.6,
    background: '#003B73',
  },
  {
    dest: path.join(WEB_PUBLIC, 'icon-512.png'),
    width: 512,
    height: 512,
    compositeIcon: true,
    iconScale: 0.6,
    background: '#003B73',
  },
  {
    dest: path.join(WEB_PUBLIC, 'apple-touch-icon.png'),
    width: 180,
    height: 180,
    compositeIcon: true,
    iconScale: 0.6,
    background: '#003B73',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensure directory exists */
function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Render the SVG icon at the given pixel dimensions using sharp.
 * Returns a PNG buffer.
 */
async function rasterizeSvg(
  svgBuffer: Buffer,
  widthPx: number,
  heightPx: number
): Promise<Buffer> {
  return sharp(svgBuffer, { density: 300 })
    .resize(widthPx, heightPx, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toBuffer();
}

/**
 * Create a solid-color tile or transparent tile at size, then optionally
 * composite the icon SVG centered within it.
 */
async function generateTile(spec: OutputSpec, svgBuffer: Buffer): Promise<void> {
  ensureDir(spec.dest);

  const { width, height, background, compositeIcon, iconScale } = spec;

  // 1. Create base tile
  let base: sharp.Sharp;
  if (background === null) {
    // Transparent background
    base = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });
  } else {
    const bg = background as string;
    const r = parseInt(bg.slice(1, 3), 16);
    const g = parseInt(bg.slice(3, 5), 16);
    const b = parseInt(bg.slice(5, 7), 16);
    base = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r, g, b, alpha: 255 },
      },
    });
  }

  if (!compositeIcon) {
    await base
      .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
      .toFile(spec.dest);
    return;
  }

  // 2. Compute icon size: scale relative to smallest dimension
  const iconSize = Math.round(Math.min(width, height) * iconScale);
  const iconBuffer = await rasterizeSvg(svgBuffer, iconSize, iconSize);

  // 3. Center position
  const left = Math.floor((width - iconSize) / 2);
  const top = Math.floor((height - iconSize) / 2);

  // 4. Composite icon onto base
  await base
    .composite([
      {
        input: iconBuffer,
        left,
        top,
        blend: 'over',
      },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toFile(spec.dest);
}

// ---------------------------------------------------------------------------
// Build summary
// ---------------------------------------------------------------------------
interface BuildEntry {
  path: string;
  width: number;
  height: number;
  sizeBytes: number;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log('Relay launcher-gen — starting');
  console.log(`SVG source: ${SVG_PATH}`);

  if (!fs.existsSync(SVG_PATH)) {
    throw new Error(`SVG not found: ${SVG_PATH}`);
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);
  const buildEntries: BuildEntry[] = [];

  for (const spec of OUTPUTS) {
    process.stdout.write(`  generating ${path.relative(REPO_ROOT, spec.dest)} (${spec.width}x${spec.height})...`);
    await generateTile(spec, svgBuffer);
    const stat = fs.statSync(spec.dest);
    buildEntries.push({
      path: path.relative(REPO_ROOT, spec.dest),
      width: spec.width,
      height: spec.height,
      sizeBytes: stat.size,
    });
    console.log(` ${stat.size} bytes`);
  }

  // Write build.json summary
  const buildJsonPath = path.join(__dirname, '..', 'build.json');
  const buildJson = {
    generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    svgSource: path.relative(REPO_ROOT, SVG_PATH),
    files: buildEntries,
  };
  fs.writeFileSync(buildJsonPath, JSON.stringify(buildJson, null, 2) + '\n');
  console.log(`\nBuild summary written to ${path.relative(REPO_ROOT, buildJsonPath)}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('launcher-gen failed:', err);
  process.exit(1);
});
