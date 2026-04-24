# @relay/tools-launcher-gen

Generates all platform launcher icons and splash PNGs from the Relay brand SVG.

## Usage

```bash
# From repo root:
pnpm launcher:gen

# Or directly:
pnpm --filter @relay/tools-launcher-gen gen
```

## When to re-run

Re-run this script whenever `packages/ui-core/src/brand/assets/icon-light.svg` changes.
The generated PNG files are committed to the repository so Expo and the Next.js build
do not require this script at build time.

## Outputs

| File | Size | Purpose |
|------|------|---------|
| `apps/mobile/assets/icon.png` | 1024×1024 | iOS app icon (blue bg + icon) |
| `apps/mobile/assets/adaptive-icon.png` | 1024×1024 | Android foreground layer (transparent bg) |
| `apps/mobile/assets/splash.png` | 1242×2436 | Expo splash screen |
| `apps/mobile/assets/favicon.png` | 48×48 | Expo web fallback favicon |
| `apps/web/public/icon-192.png` | 192×192 | PWA manifest icon |
| `apps/web/public/icon-512.png` | 512×512 | PWA manifest icon |
| `apps/web/public/apple-touch-icon.png` | 180×180 | iOS home screen bookmark icon |

A `build.json` summary file is written to `tools/launcher-gen/build.json` after each run,
recording file paths, dimensions, and byte sizes for reproducibility.

## Determinism

The generator uses consistent sharp settings (Lanczos3 kernel, compressionLevel 9,
no adaptive filtering, no metadata embedding) so the same SVG input always produces
byte-identical output.

## Dependencies

- [sharp](https://sharp.pixelplumbing.com/) — high-performance Node.js image processing
