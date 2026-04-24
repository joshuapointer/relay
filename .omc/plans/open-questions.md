# Open Questions

## autopilot-impl — 2026-04-22

- [ ] Live map vendor (Mapbox vs Google Maps) — MVP ships a teal-route placeholder on both web and mobile. Decide before v1.1 because SDK footprint + brand-styling latitude differ.
- [ ] Sign in with Apple gate for iOS — Apple requires SIWA if *any* other social login is offered on iOS. Blocks App Store submission. Current plan ships Clerk email/password + Google; flag immediately if iOS App Store submit is in scope.
- [ ] Dark-mode intent (truly excluded vs. deferred-but-designed-for) — current tokens are semantically layered, but a second color file is needed to actually flip themes. Affects token shape today.
- [ ] Notification copy catalog (~15 transitions) — draft strings ship per tone guide (`apps/api/src/content/notifications.ts`); writer agent should review and lock before v1.0 public launch.
- [ ] Real-time web transport confirmed as Socket.IO (spec §2.3) — SSE was the open alternative. Plan commits to Socket.IO; revisit only if scale or client-side constraint forces it.
- [ ] Share-link TTL — default 30 days post-`DELIVERED`; confirm with product.
- [ ] Analytics vendor for MVP (PostHog / Amplitude / none) — currently nothing ships; Sentry is error-only. Affects privacy policy + client SDK footprint.
- [ ] Barcode scan on mobile — currently deferred; Expo supports it cheaply. Decide for v1.1.
- [ ] 100-active-shipments cap — shipped as env-driven config (`RELAY_ACTIVE_SHIPMENTS_CAP=100`); confirm whether this is a product cap or just a cost guardrail.
- [ ] Tracking-event retention policy — default 90d post-archive suggested by analyst; purge job not in MVP. Legal/GDPR implications of raw carrier payloads in `TrackingEvent.rawPayload` still open.
- [ ] Team / shared shipments model — currently single-owner. Schema future-proofing question (owner_id vs org_id) deferred.
- [ ] GDPR/CCPA posture — "best-effort, not audited" for MVP per analyst default; confirm before any EU traffic.
- [ ] Expected MAU at launch vs 6 months — drives Clerk tier, Fly sizing, Neon plan. Not blocking MVP but blocks capacity planning.
