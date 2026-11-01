# Level 04 challenges · API Fundamentals

## Recall round (+10 XP each)
Answer out loud or in writing **without notes**. Tick only when you can explain it in under 2 minutes.

1. [ ] Which HTTP methods are idempotent, and how does an idempotency key make POST safe to retry?
2. [ ] Token bucket vs sliding-window rate limiting: how does each behave under a burst?
3. [ ] JWT vs server-side sessions: how do you revoke a JWT before it expires?
4. [ ] OAuth 2.0 vs SSO vs OIDC: what problem does each solve?
5. [ ] REST vs gRPC vs GraphQL: pick one for (a) a public API, (b) internal service-to-service calls, (c) a mobile app with many screens.
6. [ ] Offset vs cursor pagination: why does offset break on large, changing tables?

## Boss fight (+50 XP)
> Design a public payments API (create charge, refund, list transactions). Cover endpoints, the idempotency-key flow, pagination, rate limits per merchant, and auth.

Rules: 30–45 minutes, draw it in Excalidraw, save your answer as `boss-fight.md` (and the diagram) in this folder. Then ask Claude: *"Act as a senior interviewer. Here is my design for … Grade it 1–10 and tell me what's missing."*

- [ ] Boss defeated (score ≥ 7/10)
