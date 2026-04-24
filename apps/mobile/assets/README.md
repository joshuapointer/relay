# Mobile Assets

## Image Assets (placeholder)

The following PNG files are required by app.json but are placeholders pending WS-D-03b generator script:

- `icon.png` — 1024x1024 solid #003B73 PNG (app icon)
- `splash.png` — 1284x2778 splash screen with #003B73 background
- `adaptive-icon.png` — 1024x1024 foreground layer for Android adaptive icon
- `favicon.png` — 48x48 web favicon

To generate real assets, run the WS-D-03b script:
```
pnpm --filter @relay/design-tokens exec node tooling/scripts/generate-icons.mjs
```

## Font Assets (placeholder)

Font TTF files are vendored by WS-D-03c. Required files in `fonts/`:

- `Poppins-Regular.ttf`
- `Poppins-Medium.ttf`
- `Poppins-SemiBold.ttf`
- `Poppins-Bold.ttf`
- `Inter-Regular.ttf`
- `Inter-Medium.ttf`

Until fonts land, the app falls back to system fonts (iOS: SF Pro, Android: Roboto).
The root `_layout.tsx` wraps `useFonts()` but does not gate rendering on font load.
