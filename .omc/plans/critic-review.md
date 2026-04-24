# Critic Review — Relay Autopilot Phase 1 Plan

## Verdict: APPROVE WITH AMENDMENTS

Phase 2 can start after 7 blocking amendments are applied in-place (no replan needed).

---

## Rubric scores

| # | Dimension | Grade | Justification |
|---|---|---|---|
| 1 | Requirements coverage | B- | Share link, web account-deletion, notification copy catalog gaps |
| 2 | Task atomicity | B | WS-A-04, WS-A-05, WS-D-03 too large |
| 3 | Dependency correctness | C+ | WS-D-02 false independence; under-parallelized |
| 4 | Definition of done | B | Several vague hedges ("placeholder OK") |
| 5 | MVP scope discipline | A- | Cut list disciplined; minor creep in WS-A-05 |
| 6 | Risk register | C | Missing sandbox/cred risks |
| 7 | Conventions coherence | B+ | Jest vs Vitest contradiction, ESLint 9 flat vs legacy contradiction |
| 8 | Brand implementation | A- | BR-11 not machine-verifiable |
| 9 | Verification plan | B | No visual regression for mockups |
| 10 | Realistic for autopilot | C | 33 tasks/12 batches aggressive |

---

## 7 Blocking issues (must fix before execution)

### 1. No offline / no-credentials execution path for Clerk + EasyPost
Plan assumes live EasyPost + Clerk sandbox keys. Autopilot sandbox lacks them.
- Affected: WS-A-03, WS-A-04, WS-A-05, WS-A-07, WS-C-02, verification step 10
- **Fix**: Every acceptance has two modes: (a) offline mock mode default (MSW for EasyPost + local HMAC signer for webhook + local JWT signer for Clerk); (b) live mode flag-gated (skipped when `$EASYPOST_API_KEY` empty). Ship `tests/fixtures/clerk.ts` signer in WS-A-03, consumed by later tasks.

### 2. DAG inconsistency — WS-D-02 placement contradicts itself
WS-D-02 is Phase 3 deliverable but Batch 3 dependency for WS-B-02/WS-C-02.
- **Fix**: Move WS-D-02 to Phase 2 (Core slice). Batch 3 placement retained. Or split WS-D-02a (Button/Text/Card stub in Batch 3) / WS-D-02b (polish in Batch 6).

### 3. Test runner contradiction for API
WS-A-01 declares jest.config.cjs but Section 4 + Section 6 specify Vitest.
- **Fix**: WS-A-01 → vitest.config.ts. All WS-A-* acceptance examples use `vitest run -t <name>`.

### 4. Share link feature referenced but never defined
WS-B-04 DoD references `POST /v1/shipments/:id/share` with TODO "flag back to WS-A". Spec §4 REST table, Prisma schema §3, and no WS-A task define this.
- **Fix**: Add WS-A-04c · Share link feature (opus): new `ShareLink` Prisma model (token, shipmentId, expiresAt), routes `POST /v1/shipments/:id/share` + public `GET /v1/share/:token`, Zod DTOs, rate-limit 60/hour. Or defer feature to v1.1 and drop AC-10.

### 5. ShipmentStatus enum divergence
Spec §3 defines 7-member internal enum (PENDING|IN_TRANSIT|OUT_FOR_DELIVERY|DELIVERED|EXCEPTION|RETURNED|UNKNOWN). Requirements §2.3 #20 + AC-8 specify 5-state user-facing enum. RETURNED/UNKNOWN leak to product surface.
- **Fix**: WS-A-02 defines both `DisplayShipmentStatusSchema` (5-member, user-facing, serialized) and `InternalShipmentStatusSchema` (7-member, persisted). Mapping in `status-map.ts`: RETURNED|UNKNOWN → EXCEPTION.

### 6. Critical path miscounted
Section 2 critical path has `WS-B-03 → WS-B-05 → WS-E-04` but WS-B-05 precondition is WS-B-04 (not WS-B-03), and WS-E-04 doesn't depend on WS-B-05.
- **Fix**: Rewrite as `WS-E-01 → WS-A-01 → WS-A-02 → WS-A-03 → WS-A-04a → WS-A-04b → WS-A-04c → WS-A-05 → WS-A-06 → WS-B-02 → WS-B-03 → WS-B-04`. WS-E-04 becomes parallel release gate, not serial node.

### 7. Notification copy catalog not produced
WS-A-05 references `apps/api/src/content/notifications.ts` but no task authors it. Content-lint can only fail on forbidden strings, not assert required strings exist.
- **Fix**: Add WS-A-05a · Locked notification copy catalog (haiku). Produces `apps/api/src/content/notifications.ts` with all ~15 transition strings, unit test asserting every (fromStatus, toStatus) pair has a locked string.

---

## Non-blocking improvements

- Split WS-A-04 into WS-A-04a (CRUD + EasyPost adapter) + WS-A-04b (webhook + idempotency + HMAC + circuit breaker). Different failure modes, different tests.
- Split WS-D-03 into WS-D-03a (logo + icon SVGs, opus), WS-D-03b (launcher generator script, sonnet), WS-D-03c (font vendoring + licenses, haiku).
- BR-11 ("R stroke continues into icon"): require human reviewer sign-off, not just SVG checksum.
- Add WS-D-04 item #11: Playwright `toHaveScreenshot()` regression for the 3 required mockups.
- WS-E-01: resolve ESLint 9 flat config vs legacy extends — pick one consistently.
- WS-E-02: replace "may skip in CI" with explicit skip rationale capture.
- WS-C-01: add `pnpm --filter @relay/mobile exec expo prebuild --platform ios --no-install` dry-run.
- WS-B-01/WS-C-01: document Clerk config — email+password only for MVP (no social, no magic link UI).

---

## Execution readiness checklist

- [ ] Requirements fully mapped (share, web account-delete, copy catalog gaps)
- [ ] DAG valid (WS-D-02 placement, WS-B-04 hidden dep, critical path miscount)
- [x] MVP is actually MVP
- [ ] Offline/no-creds path exists (HIGHEST PRIORITY FIX)
- [x] Brand acceptance tests specified (add mockup regression)
- [ ] Critical path time-boxed (add MVP-minus fallback)

---

## Summary

**Verdict: APPROVE WITH AMENDMENTS.** Phase 2 starts after 7 amendments land. Estimated edit time: 30-45 min. No replan required.

Top 3 blockers:
1. Offline/no-creds path (MSW + local signers, mock default)
2. DAG inconsistency (WS-D-02 placement, share-link task missing)
3. Config contradictions (Jest vs Vitest, ESLint 9 flat vs legacy, enum divergence)
