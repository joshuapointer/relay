# @relay/tools-content-lint

Tone-guide enforcement tool for Relay UI-facing copy.

## What it enforces

Forbidden words (case-insensitive, whole-word match):

| Word | Why |
|---|---|
| `just` | Implies the task is trivial — can feel dismissive |
| `maybe` | Introduces unnecessary uncertainty |
| `simply` | Condescending — implies the user should find it easy |
| `sorry` | Apologetic tone undermines trust in the product |
| `unfortunately` | Negative framing; reframe as what the user can do instead |
| `oops` | Too casual / infantilizing for an error state |
| `hmm` | Filler word — adds no information |
| `yay` | Over-enthusiastic; use a calm, confident tone instead |

Warnings (non-blocking):

- More than one exclamation mark (`!!`) in a user-visible string literal

## What it ignores

- Source code comments (`//` and `/* */`)
- JSX attribute names containing hyphens (e.g. `justify-content`)
- Non-UI-facing files (only scans `apps/web/{app,components,lib}`, `apps/mobile/{app,components,constants}`, `apps/api/src/content`)

## Tone guide reference

Copy should be:
- **Calm and direct** — no exclamation overload, no apologies
- **Confident** — avoid hedging words like "maybe" or "might"
- **Empowering** — tell users what they CAN do, not what went wrong

## Usage

```bash
# From repo root
pnpm content:lint

# Run tests
pnpm --filter @relay/tools-content-lint test

# Run directly
pnpm --filter @relay/tools-content-lint lint
```

## Exit codes

- `0` — No forbidden words found (warnings are non-blocking)
- `1` — One or more forbidden words detected

## Adding new rules

Edit `tools/content-lint/src/index.ts` and add words to the `FORBIDDEN_WORDS` array. Add a test case in `src/__tests__/lint.test.ts`.
