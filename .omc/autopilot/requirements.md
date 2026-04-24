# Relay — Shipment Tracking Platform: Requirements Spec (MVP)

**Document owner:** Phase 0 Analyst
**Status:** Draft for architect consumption
**Date:** 2026-04-22
**Scope:** MVP v1.0

---

## 1. Product Overview

Relay is a cross-platform shipment tracking product that gives individuals a single, trustworthy place to watch every package they are expecting, regardless of carrier. It unifies iOS, Android, and web experiences on top of one backend, pulling carrier data through a third-party aggregator (EasyPost recommended for MVP — see §2.4) so users can paste any tracking number and get normalized status, a live map, an event timeline, and proactive push/web notifications when things change — especially when they go wrong. The product is positioned around "Trusted Clarity": users open Relay because they want to know exactly where their stuff is, in plain language, without decoding carrier jargon or hunting across five different carrier websites.

**Target users (MVP):** Individual consumers and prosumers (freelancers, small-shop operators, resellers) tracking 1–50 active shipments at a time across US domestic carriers (UPS, USPS, FedEx, DHL).

**Primary value prop:** One inbox for every shipment, with proactive delay alerts written in human language and a consistent experience across phone and laptop.

**Primary success metric (informational, not in-scope to build):** percentage of active shipments where user opens the app after a proactive notification rather than before one (target > 60%, indicating trust in the notification stream).

---

## 2. In-Scope Functional Requirements

### 2.1 Identity & accounts
1. Users can sign up with email + password.
2. Users can log in with email + password.
3. Users can request a passwordless magic link as an alternative login method.
4. Users can log out from any device.
5. Users can view and edit a minimal profile: display name, email, timezone, notification preferences.
6. Users can request a password reset via email.
7. Users can delete their account; deletion removes all PII and tracking history within 30 days.
8. Session tokens expire after 30 days of inactivity on mobile, 14 days on web.

### 2.2 Adding & managing shipments
9. Users can add a shipment by pasting or typing a tracking number; the app auto-detects the carrier via the aggregator.
10. If carrier auto-detection is ambiguous, the user is prompted to pick from a list.
11. Users can optionally assign a human-friendly nickname per shipment ("Mom's birthday gift").
12. Users can view a list of active shipments sorted by most recent status change, with filters: All / In Transit / Out for Delivery / Delivered / Exception.
13. Users can archive a delivered shipment; archived shipments are retrievable but hidden from the default list.
14. Users can delete a shipment from their account (removes from their view; underlying carrier event data may still be cached server-side for audit).
15. The active-shipments list supports pull-to-refresh on mobile and a manual refresh control on web.
16. Maximum 100 active (non-archived) shipments per account in MVP (see §4 rate limits).

### 2.3 Shipment detail view
17. Detail view shows: current status, carrier name + logo, tracking number (copyable), origin, destination, estimated delivery window, last event timestamp.
18. Detail view shows a map panel with: origin pin, destination pin, and (when available) current-location pin plus a teal route line (see §5 brand).
19. Detail view shows a chronological event timeline — newest event first — with timestamp, location, and plain-language description.
20. Status is one of an enumerated set: `Pending`, `In Transit`, `Out for Delivery`, `Delivered`, `Exception` (covers delay, damaged, returned-to-sender, address issue).
21. Each status has a documented display label, icon, and color (see §5).
22. Users can share a read-only link to a shipment's current status (public token link, no auth required, rate-limited).

### 2.4 Carrier integration
23. MVP integrates with **EasyPost** as the single upstream carrier aggregator. Rationale: one integration unlocks UPS, USPS, FedEx, DHL, and ~100 others; mature webhook support for status updates; sandbox environment available. ShipEngine is the documented fallback if EasyPost pricing or reliability fails during build; architect chooses final vendor but defaults to EasyPost.
24. On shipment creation, Relay registers the tracking number with the aggregator and subscribes to its update webhook.
25. Relay normalizes aggregator status codes into Relay's 5-state enum (see §2.3 #20). A mapping table must be maintained in the backend.
26. When the aggregator pushes an update, Relay updates the shipment record, appends the event to the timeline, and fans out notifications (see §2.5).
27. If the aggregator is unreachable for > 5 minutes, Relay degrades gracefully: list/detail views still load from cached state and show a non-blocking banner "Live updates temporarily paused."
28. Aggregator API credentials are stored server-side only, never shipped to client bundles.

### 2.5 Real-time updates & notifications
29. On mobile, status changes trigger a push notification (APNs on iOS, FCM on Android). Users can opt into/out of: all status changes, only exceptions/delays, only delivered, off.
30. On web, an open tracking page receives live updates via a WebSocket connection (fallback: 30-second polling if WebSocket unavailable).
31. Notification copy follows the brand tone (see §5.6). Examples:
    - In Transit → Out for Delivery: *"Your package is out for delivery today. Keep an eye out."*
    - Exception (weather delay): *"Heads up — weather is slowing this one down. New estimated delivery: Fri, Apr 25."*
    - Delivered: *"Delivered. If you can't find it, tap here to check the drop-off location."*
32. Notifications include deep links that open the relevant shipment detail view.
33. Duplicate/noisy events from the aggregator are de-duplicated server-side (same status + same timestamp within 60s collapses to one notification).

### 2.6 Proactive delay messaging
34. When a shipment's estimated delivery slips by more than 24 hours, Relay sends a proactive notification explaining the delay in plain language, using the reassuring tone (§5.6).
35. When a shipment enters `Exception` state, Relay sends a notification within 2 minutes of receiving the aggregator event.
36. Delay messages never use blame language ("the carrier failed") and never use cheerful emoji for negative events.

---

## 3. Out of Scope (explicitly NOT in MVP)

- Shipping label purchase, rate shopping, or label printing.
- Warehouse / inventory management, bulk shipment import via CSV or API.
- Payments, subscriptions, billing, or paid tiers (MVP is single free tier).
- Multi-user organizations, team accounts, role-based access.
- Shared shipments between accounts (other than the read-only public share link in #22).
- SMS notifications (push + in-app + email only).
- Email notifications beyond auth flows (password reset, magic link). No notification emails in MVP.
- Native desktop apps (macOS/Windows/Linux); web PWA only.
- Offline-first capability (app requires connectivity; last-known state is cached but no offline queue of user actions).
- Internationalization / localization beyond English (en-US).
- Currency conversion, customs / duties estimation, international address validation beyond what the aggregator returns.
- Carrier-specific features not exposed through the aggregator (e.g. UPS "My Choice" redirect, USPS Informed Delivery photos).
- AI chatbots, LLM summarization, voice assistants.
- Analytics dashboards for end users ("you tracked 47 shipments this year" style reports).
- Admin web console for Relay staff (deferred — operations use direct DB/aggregator dashboards for MVP).

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **P50 API latency** for list/detail reads: < 200 ms at the edge.
- **P95 API latency** for list/detail reads: < 600 ms.
- **Cold app launch to home screen:** < 2.5 s on a mid-tier device (iPhone 12 / Pixel 6a baseline).
- **Notification latency** from aggregator webhook receipt to device notification: P95 < 30 s.
- **WebSocket reconnect** on web after network blip: < 5 s.

### 4.2 Availability
- Target 99.5% monthly uptime for the backend API.
- Graceful degradation when aggregator is down (see §2.4 #27).

### 4.3 Accessibility
- Meet **WCAG 2.1 AA** on web and mobile.
- Minimum 4.5:1 contrast for body text against its background. Brand palette must be audited against this (notably Agile Teal on white for non-large text).
- All interactive elements have accessible labels, focus states, and minimum 44×44 pt touch targets on mobile.
- Screen reader support: VoiceOver (iOS), TalkBack (Android), and standard ARIA on web.
- No information conveyed by color alone — status pills pair color with a text label and/or icon.
- Respect OS "reduce motion" setting (disable map camera animations, timeline slide-ins).

### 4.4 Security
- Passwords hashed with Argon2id or bcrypt (cost ≥ industry default at build date).
- Auth tokens are short-lived JWT or opaque session tokens; refresh tokens rotated.
- All client ↔ backend traffic over TLS 1.2+.
- Secrets (aggregator keys, push cert keys, DB creds, webhook signing secret) managed via a secret store (e.g. AWS Secrets Manager / GCP Secret Manager / Doppler) — never in source, never in client bundles, never in plaintext env files committed to git.
- Aggregator webhooks verified via HMAC signature before processing.
- Public share links (§2.3 #22) use unguessable tokens (≥ 128 bits entropy), are rate-limited, and reveal only shipment status + timeline — never the owner's name, email, or full address.
- PII (name, email, addresses) encrypted at rest.
- Rate limits on auth endpoints (login, signup, password reset, magic link) to prevent brute force / enumeration.
- Account deletion completes within 30 days (see §2.1 #7), including purging from backups on their next rotation.

### 4.5 Observability
- Structured logs for all API requests and webhook handler invocations.
- Metrics: request rate, error rate, latency histograms, webhook processing lag, notification send success/failure, aggregator API health.
- Error tracking (e.g. Sentry) on mobile, web, and backend.
- Distributed trace IDs propagated from client → API → webhook handler where applicable.
- Alerting on: aggregator 5xx rate > 5% for 10 min, notification send failure rate > 2%, WebSocket disconnect storm, API p95 > 1.5 s for 15 min.

### 4.6 Privacy & compliance
- Privacy policy and terms-of-service links reachable from sign-up and settings.
- Account deletion is user-initiated and self-serve (§2.1 #7).
- MVP assumes US-only launch. GDPR/CCPA are design-influential but formal compliance is documented as "best-effort, not audited" for MVP (see §7 open questions).

---

## 5. Brand Implementation Checklist (Testable Acceptance Criteria)

Each line is a pass/fail design/QA check. The brand brief is the source of truth; ambiguity resolves in favor of the "Trusted Clarity" principle.

### 5.1 Color tokens — must be defined as named tokens in mobile + web code
| Token | Hex | Allowed usage | Forbidden usage |
|---|---|---|---|
| `color.primary.deepTechBlue` | `#003B73` | logos, top nav, headers, primary buttons, FAB | error/destructive states |
| `color.secondary.agileTeal` | `#00C2CB` | tracking route lines, accents, interactive highlights, icon accents | body text (contrast fail), delivered state |
| `color.accent.amber` | `#FFB800` | In Transit + delay/warning pills, non-blocking banners | delivered, destructive, primary CTA |
| `color.feedback.successGreen` | `#2ECC71` | Delivered status ONLY | any other affirmative UI (use primary blue) |
| `color.neutral.cloudGray` | `#F4F6F9` | app backgrounds, card surfaces, dividers | text, active states |
| `color.text.inkBlack` | `#1A1A1A` | primary body copy, headings | backgrounds, icon fills on dark surfaces |

- **BR-1:** Delivered status uses `successGreen` and nothing else uses it. Grep-able check: `successGreen` referenced only from the Delivered status component.
- **BR-2:** In Transit status uses `amber`. Delay/exception states also use `amber` but pair it with an exception icon to differentiate.
- **BR-3:** All six tokens exist as first-class design tokens (e.g. in a `tokens.ts` / `theme.json` / Tailwind config) — no hardcoded hex strings in feature components.

### 5.2 Typography
- **BR-4:** Headers use **Poppins** in Bold, Semi-Bold, or Medium weights only.
- **BR-5:** Body copy uses **Inter** in Regular or Medium weights only.
- **BR-6:** Fonts are loaded via a reliable mechanism (Expo font loader on mobile, `@fontsource` or self-hosted WOFF2 on web); no FOIT longer than 500 ms.
- **BR-7:** Fallback stack documented: Poppins → system-ui sans-serif; Inter → system-ui sans-serif. Fallback must not cause layout shift > 0.1 CLS.

### 5.3 Logo & wordmark
- **BR-8:** Wordmark reads **"Relay"** — uppercase `R`, lowercase `elay`, single word, no space.
- **BR-9:** Typeface is a clean modern slightly-rounded sans-serif consistent with Poppins (the wordmark is a custom lockup but harmonizes with Poppins).
- **BR-10:** Icon is positioned to the **left** of the wordmark in all horizontal lockups.
- **BR-11:** The horizontal stroke of the `R` subtly extends into the icon — there is visible continuity between wordmark and icon, not a gap.
- **BR-12:** Minimum clear space around the lockup equals the height of the lowercase `e` in the wordmark on all four sides.
- **BR-13:** Minimum display size: 24 px tall for the wordmark on screen.

### 5.4 Icon (app-level brand mark)
- **BR-14:** The icon is a stylized looping pathway that forms the letter `R`.
- **BR-15:** The tail of the `R` transforms into a forward-pointing arrow.
- **BR-16:** The arrow encloses (visually contains) a small rectangular package shape.
- **BR-17:** Rendered as minimalist continuous line art — single continuous stroke, no breaks.
- **BR-18:** Corners are softly rounded; no hard 90° angles on stroke joins or terminals.

### 5.5 Required mockups — each is a testable visual spec
#### 5.5.1 App launcher icon
- **BR-19:** Square tile background is solid `deepTechBlue` (`#003B73`).
- **BR-20:** The Relay Icon is centered in the tile.
- **BR-21:** Icon stroke is rendered in **white** with **Agile Teal** (`#00C2CB`) accents on the arrow and/or package.
- **BR-22:** Continuous line art rule (BR-17) holds at launcher sizes down to 48×48.
- **BR-23:** Icon is produced in all platform-required sizes (iOS: 1024, 180, 120, 87, 80, 60, 58, 40, 29, 20; Android: adaptive icon foreground + background layers at xxxhdpi through mdpi; web: favicon + 192/512 PWA).

#### 5.5.2 Mobile home screen
- **BR-24:** Full logo lockup (icon + wordmark) displayed in the header, top-left aligned.
- **BR-25:** Greeting reads **"Welcome back, [Name]"** in **Inter Regular**. `[Name]` comes from the user's profile display name.
- **BR-26:** A primary tracking card is elevated (shadow / elevation) on a white surface over the `cloudGray` app background.
- **BR-27:** The tracking card's status badge reads **"In Transit"** in `amber`.
- **BR-28:** The tracking card includes a location line styled in `agileTeal`.
- **BR-29:** A floating action button (FAB) is rendered in `deepTechBlue` with a white `+` glyph, positioned bottom-right. Tapping it opens "Add shipment".

#### 5.5.3 Web tracking page
- **BR-30:** Top navigation bar is `deepTechBlue` background with the wordmark in white.
- **BR-31:** Page is a two-column layout: **map occupies ~60%** of the viewport width; left **info panel ~40%**.
- **BR-32:** Info panel cards use `cloudGray` surfaces.
- **BR-33:** Card titles render in **Poppins Semi-Bold**.
- **BR-34:** Card detail text renders in **Inter Regular**.
- **BR-35:** The route line overlaid on the map is `agileTeal`.

### 5.6 Tone of voice (content acceptance criteria)
- **BR-36:** All user-facing strings favor clarity over cleverness — no puns, no dad jokes, no pirate speak.
- **BR-37:** Notifications and status copy are proactive (tell the user what's happening before they ask) and reassuring (acknowledge the emotional weight — people care about their packages).
- **BR-38:** Professional but helpful — no corporate jargon ("per our system"), no faux-casual ("oopsie!"). Sample allowed voice: "Heads up — your package is delayed. New estimate: Friday." Sample forbidden voice: "Oh no, your package is lost in the void!"
- **BR-39:** Negative events (delays, exceptions) never use celebratory emoji (🎉, 🚀) or exclamation points stacked more than one deep.
- **BR-40:** Delivered events may use a single understated celebratory cue (one check icon; optional single 🎉 — product decides, but consistent across platforms).

---

## 6. Platform Matrix

Legend: ✅ ships in MVP · 🟡 platform-specific variant · ❌ not on this platform in MVP

| Capability | Mobile (iOS + Android) | Web | Notes / divergent UX |
|---|---|---|---|
| Email/password sign-up + login | ✅ | ✅ | Identical flows |
| Magic-link login | ✅ | ✅ | Deep link opens mobile app if installed, else web |
| Password reset | ✅ | ✅ | Email contains link that works on either platform |
| Profile edit | ✅ | ✅ | Identical |
| Add shipment (paste tracking #) | ✅ | ✅ | Mobile additionally supports 🟡 paste-from-clipboard detection on app foreground |
| Add shipment via barcode scan | 🟡 | ❌ | Mobile-only (uses device camera). Out of scope for web in MVP. |
| List active shipments | ✅ | ✅ | |
| Shipment detail + map + timeline | ✅ | ✅ | Mobile map is full-screen tappable; web map is 60% of viewport (BR-31) |
| Real-time updates while viewing | 🟡 | 🟡 | Mobile: push + in-app update on foreground. Web: WebSocket (fallback polling). |
| Push notifications | ✅ | ❌ | Browser web push is **out of MVP scope** (see §3). |
| In-app notification center | ✅ | ✅ | Shows last 30 notifications per user |
| Proactive delay alerts | ✅ | 🟡 | Mobile via push; web surfaces via in-app + email? **NO** — in-app only per §3. |
| Public share link (read-only) | ✅ (generate + share) | ✅ (generate + share + view) | Viewing a share link does NOT require auth |
| Share link viewer UI | 🟡 | ✅ | Mobile opens share links inside the app if installed, else falls through to web viewer |
| Archive / delete shipment | ✅ | ✅ | Identical |
| Delete account | ✅ | ✅ | Available from settings on both |
| Dark mode | ❌ | ❌ | Out of scope MVP (confirm in §7) |
| Localization | ❌ | ❌ | English only MVP |
| Offline cache of last-known state | 🟡 | ❌ | Mobile shows cached list/detail when offline with a banner; web requires network |

---

## 7. Open Questions & Assumptions

### Assumptions made (MVP defaults where the brief was silent)
- **A1:** Single-user accounts only. No orgs/teams.
- **A2:** English (en-US) only. No i18n framework in MVP (but string externalization is still good practice — flagged for architect).
- **A3:** Online-first. Mobile caches last-known state but does not queue offline user actions.
- **A4:** Auth = email + password, with magic link as an optional alternative. No social login (Google/Apple) in MVP.
- **A5:** US launch. Carriers focused on UPS/USPS/FedEx/DHL domestic, though aggregator covers more.
- **A6:** Aggregator = **EasyPost**. ShipEngine is the documented fallback.
- **A7:** Free tier only; no billing plumbing.
- **A8:** Dark mode is **out of scope** for MVP (brand palette brief implies light-mode surfaces; dark mode needs separate token definitions).
- **A9:** Web is a **responsive SPA / PWA**, not a native desktop app. Mobile breakpoint on web is supported but the mobile apps are the preferred phone experience.
- **A10:** Maps are provided by a single vendor (Mapbox or Google Maps) — architect chooses; brand requires the route line in `agileTeal` (BR-35) which both vendors support via styled layers.
- **A11:** Email delivery (for password reset and magic link) uses a transactional provider (Postmark / SendGrid / SES) — architect chooses.
- **A12:** Push infra uses Expo Push for MVP simplicity, with a documented path to direct APNs/FCM if Expo becomes a bottleneck.

### Open Questions
- [ ] Is multi-user / household sharing a fast-follow after MVP? — Affects data model (owner_id vs. org_id) and whether architect should design with a deliberately future-proof schema.
- [ ] GDPR/CCPA posture: is "best-effort, not audited" acceptable for MVP? — Affects DPA language, data-residency decisions, and whether we need explicit cookie consent on web.
- [ ] Do we want social login (Sign in with Apple / Google) in MVP? Apple specifically **requires** Sign in with Apple if any other social login is offered in the iOS app — so this is a yes/no gate, not a gradient.
- [ ] Exact notification copy catalog: the three samples in §2.5 #31 are illustrative. Does product want to lock copy for all ~15 status transitions now, or allow the writer agent to draft and product to review?
- [ ] Which map vendor: Mapbox or Google Maps? Pricing and brand-styling latitude differ; architect needs this decision before picking an SDK.
- [ ] Real-time transport on web: confirm WebSocket preference vs. Server-Sent Events (SSE). SSE is simpler and one-way (which matches our need) but WebSocket was explicitly mentioned in the brief.
- [ ] Data retention: how long do we keep timeline events for an archived/deleted shipment? Default suggested: 90 days after archive, then purge. Needs confirmation.
- [ ] Aggregator cost model: EasyPost charges per tracker. Is the 100-active-shipments-per-account cap (§2.2 #16) a real product cap or just a cost guardrail for MVP? If the latter, architect should make it config-driven.
- [ ] Dark mode: confirmed out of scope (A8) or deferred but designed-for? Decision affects token structure today.
- [ ] Does the public share link expire? Default suggested: expires 30 days after shipment is marked Delivered. Needs confirmation.
- [ ] Analytics/telemetry vendor (PostHog / Amplitude / none in MVP)? — Affects privacy policy and client SDK footprint.
- [ ] Barcode scanning on mobile (Platform Matrix row) — confirmed in MVP or deferred? Expo supports it cheaply; flagging because brief did not explicitly include it.
- [ ] App store listing assets (screenshots, descriptions) — in Phase 0 scope or handled later by designer/writer agents?

---

## 8. Acceptance Criteria per Top-Level Feature (Given / When / Then)

### AC-1: Account sign-up
- **Given** I am a new visitor on the Relay web sign-up page
- **When** I enter a valid email, a password meeting policy (≥ 10 chars, not in common-password blocklist), and submit
- **Then** my account is created, I am signed in, I land on the empty-state home screen, and I receive a welcome email **no** — per §3, no notification emails in MVP. Revision: **and I land on the empty-state home screen** (no welcome email in MVP).

### AC-2: Log in with magic link
- **Given** I have an existing Relay account and I request a magic link for my email
- **When** I click the link in the resulting email within 15 minutes on any device
- **Then** I am logged into Relay on that device and the link cannot be reused.

### AC-3: Add a shipment
- **Given** I am logged in and on the Add Shipment screen
- **When** I paste a valid tracking number and tap/click Add
- **Then** the carrier is auto-detected (or I am prompted to pick), the shipment appears in my active list within 3 seconds with status `Pending` or the most recent known status from the aggregator, and a webhook subscription is registered server-side.

### AC-4: View shipment detail
- **Given** I tap/click a shipment from the active list
- **When** the detail view loads
- **Then** I see current status, carrier, tracking number, origin, destination, estimated delivery, a map with origin/destination/current-location pins and a teal route line (BR-35), and a reverse-chronological event timeline.

### AC-5: Receive real-time status update (mobile)
- **Given** I have push notifications enabled and a shipment with status `In Transit`
- **When** the carrier aggregator sends a webhook indicating status moved to `Out for Delivery`
- **Then** within 30 seconds (NFR P95) I receive a push notification whose copy matches the brand tone (§5.6), tapping it deep-links to that shipment's detail, and the shipment row in the list reflects the new status on next foreground.

### AC-6: Receive real-time status update (web)
- **Given** I have a Relay web tab open on a shipment detail page with a live WebSocket (or polling fallback) connection
- **When** the backend receives and processes a status change for that shipment
- **Then** the detail view updates in place within 5 seconds without a manual refresh, the timeline prepends the new event, and the status pill re-renders in the correct token color.

### AC-7: Proactive delay alert
- **Given** a shipment has an estimated delivery date that slips by more than 24 hours per the aggregator
- **When** Relay's backend detects the slip
- **Then** within 2 minutes the user receives a push notification with reassuring, non-blaming copy (§5.6, BR-37, BR-38), and the shipment status pill reflects the delay (amber + exception icon per BR-2).

### AC-8: Status enum integrity
- **Given** the aggregator returns any carrier-specific status string
- **When** Relay processes the event
- **Then** the resulting shipment status is exactly one of `Pending`, `In Transit`, `Out for Delivery`, `Delivered`, `Exception` — never a raw carrier string and never null for a known tracker.

### AC-9: Accessibility — status conveyed without color
- **Given** a colorblind user or a screen-reader user on any shipment list or detail view
- **When** they read a status pill
- **Then** the pill's accessible name includes the status label text ("In Transit", "Delivered", etc.) and a non-color visual cue (icon or text) is present — they never have to perceive color to know the state.

### AC-10: Public share link
- **Given** I am a logged-in user viewing a shipment detail
- **When** I tap "Share" and copy the generated link, then an unauthenticated person opens it in a browser
- **Then** they see a read-only page with the shipment's status and timeline — no owner name, no owner email, no full address — and the link is rate-limited to prevent scraping.

### AC-11: Carrier integration fallback
- **Given** the upstream aggregator (EasyPost) is unreachable for 5+ minutes
- **When** a user loads their list or detail view
- **Then** the view renders from last-known cached state, a non-blocking banner reads "Live updates temporarily paused," and no error dialog interrupts the user.

### AC-12: Account deletion
- **Given** I am logged in and I choose Delete Account in settings and confirm
- **When** I confirm
- **Then** my session ends, my PII and shipment records are scheduled for permanent deletion within 30 days, any webhook subscriptions I owned are deregistered from the aggregator, and I receive a confirmation screen (not an email, per §3).

### AC-13: Brand token enforcement
- **Given** the shipped mobile and web apps
- **When** a designer/QA reviews against §5
- **Then** every color in the UI resolves to one of the six tokens (BR-1..BR-3), every header uses Poppins (BR-4), every body string uses Inter (BR-5), the logo lockup follows BR-8..BR-13, the icon follows BR-14..BR-18, and the three required mockups (§5.5.1–3) match their specs byte-for-byte on token choices.

---

## Analyst Review: Relay MVP Requirements

### Missing Questions (surfaced and parked in §7 as Open Questions)
1. Social login / Sign in with Apple — Apple's App Store rule makes this a yes/no gate, not a gradient, so architect needs the answer before iOS auth is designed.
2. Map vendor choice (Mapbox vs. Google Maps) — affects SDK footprint, pricing, and brand-styling latitude (teal route line support).
3. Real-time web transport (WebSocket vs. SSE) — brief said WebSocket but SSE is one-way and simpler; worth confirming.
4. Notification copy catalog — brief gave 3 samples; product may want to lock all ~15 transitions before build.
5. Dark mode — confirmed out of scope, but "deferred but designed-for" vs. "ignored" materially affects token structure today.
6. Data retention window for archived/deleted shipments.
7. Public share link expiration policy.
8. Analytics/telemetry vendor.
9. Barcode scanning on mobile — not in brief but cheap on Expo; flagged.
10. GDPR/CCPA posture for US-only launch.

### Undefined Guardrails (now defined in §2, §4)
1. Active shipment cap per account — suggested **100** (§2.2 #16) as MVP rate-limit + cost guardrail, architect should make config-driven.
2. Session lifetime — suggested 30 days mobile / 14 days web (§2.1 #8).
3. Notification latency — suggested P95 < 30 s aggregator→device (§4.1).
4. Aggregator-down grace behavior — suggested cached state + banner after 5 min unreachable (§2.4 #27).
5. Exception-event-to-notification SLA — suggested 2 min (§2.6 #35).
6. Magic link TTL — suggested 15 min (AC-2).
7. Password policy — suggested ≥ 10 chars + blocklist (AC-1).
8. Public share link scope — explicitly limited to status + timeline, never PII (§4.4, AC-10).

### Scope Risks (prevention strategies in §3 and matrix §6)
1. "Admin dashboard for ops" — explicitly excluded in §3; ops uses aggregator/DB dashboards for MVP.
2. "Email notifications beyond auth" — explicitly excluded; only push + in-app.
3. "SMS" — excluded.
4. Dark mode, i18n, offline actions, desktop apps — all explicitly out of scope in §3, prevents drift.
5. Multi-user orgs — excluded; flagged as fast-follow question so architect doesn't over-invest in an org-shaped schema without a product signal.

### Unvalidated Assumptions (enumerated in §7 A1–A12 with defaults; validate via product review before architect starts)
All 12 assumptions are listed with "how to validate" implicit: product owner confirms or overrides before Phase 1.

### Missing Acceptance Criteria — now covered
Every top-level feature has a Given/When/Then in §8 (AC-1 through AC-13), including the brand token enforcement acceptance check that makes the brand brief testable rather than aspirational.

### Edge Cases called out inline
- Ambiguous carrier auto-detection (§2.2 #10)
- Duplicate/noisy aggregator events (§2.5 #33)
- Aggregator outage (§2.4 #27, AC-11)
- Carrier returns a status string Relay's enum doesn't know (§2.4 #25, AC-8)
- Magic link replay (AC-2)
- Share link scraping (§4.4, AC-10)
- "Reduce motion" OS setting (§4.3)
- WebSocket drop on web (§2.5 #30, AC-6)

### Recommendations — things to clarify before architect starts
Ranked by impact on architecture:
1. **Map vendor + real-time transport decision** (Mapbox/Google, WebSocket/SSE) — these pick SDKs.
2. **Sign in with Apple gate** — decides iOS auth surface area.
3. **Dark-mode intent** (truly excluded vs. deferred-but-designed-for) — decides whether tokens ship as semantic (`surface.primary`) or literal (`cloudGray`) from day one.
4. **Notification copy catalog** — blocking for writer agent, not architect, but should be queued now.
5. Everything else in §7 is architect-tolerable with the documented defaults.

### Open Questions
- [ ] Multi-user / household sharing post-MVP? — Affects schema future-proofing (owner_id vs. org_id).
- [ ] GDPR/CCPA: "best-effort, not audited" acceptable for MVP? — Affects DPA, cookie consent, data residency.
- [ ] Sign in with Apple / Google for MVP? — Apple requires SIWA if any other social login is offered on iOS; yes/no gate.
- [ ] Lock full notification copy catalog (~15 transitions) now, or iterate with writer? — Blocks writer agent start, not architect.
- [ ] Map vendor: Mapbox vs. Google Maps? — Blocks mobile/web SDK choice.
- [ ] Real-time web transport: WebSocket (brief) or SSE (simpler, one-way fits)? — Blocks backend design.
- [ ] Data retention for archived/deleted shipments — default 90 days, confirm?
- [ ] 100-active-shipments cap: product cap or cost guardrail? — Decides whether config-driven.
- [ ] Dark mode truly out or deferred-but-designed-for? — Decides token shape today.
- [ ] Public share link expiration: default 30 days post-Delivered, confirm?
- [ ] Analytics vendor for MVP (PostHog/Amplitude/none)? — Affects privacy policy + SDK footprint.
- [ ] Barcode scanning on mobile in MVP (cheap on Expo) or deferred?
- [ ] App store listing assets — Phase 0 or later phase?
