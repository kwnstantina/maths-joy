---
phase: 08-guardrails-evidence
plan: 02
status: complete
requirements: [GREGAI-02, GREGAI-03]
---

# Plan 08-02 Summary: Server Enforcement + Feedback Route

## What was built
- `app/routes/api.greg-ai.tsx`: daily-cap check via `incrementDailyUsage(userId)` after auth + burst limiter + message validation, before session handling → returns `429 { error: "daily_limit_reached" }` on exceed (error code only; widget localizes). The `done` SSE event now carries the persisted `messageId`.
- `app/routes/api.greg-ai.feedback.tsx` (new, `/api/greg-ai/feedback`): POST `{ messageId, rating }` with `getUserId` auth → 401, method guard, `applyRateLimit("api")`, JSON guard, rating ∈ {1,-1} validation, delegates to ownership-checked `setMessageRating`, 404 on non-owned/missing, echoes resulting rating. No CSRF (consistent with sibling greg-ai JSON APIs).

## Key files
- created: `app/routes/api.greg-ai.feedback.tsx`
- modified: `app/routes/api.greg-ai.tsx`

## Verification
- Typecheck + lint clean. All acceptance greps pass. STRIDE threat register (IDOR, rating tampering, quota DoS, spoofing, rating spam) — all mitigated except an accepted static-error-code disclosure.

## Self-Check: PASSED
