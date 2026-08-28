# Phase 8: Guardrails & Evidence - Context

**Gathered:** 2026-07-26
**Status:** Ready for planning
**Source:** Interactive decisions (plan-phase)

<domain>
## Phase Boundary

Make the shipped Greg AI chatbot safe to launch and instrumented for tuning:
1. A **per-user daily message quota** persisted in Mongo (survives Vercel serverless cold starts), enforced on the chat endpoint, with a friendly localized limit message.
2. A **👍/👎 rating** on each assistant message, persisted and queryable for later analytics (Phase 14).

Out of scope: photo input, tools, personalization, analytics dashboard UI (those are Phases 9–14). This phase only lays the quota + feedback foundations.
</domain>

<decisions>
## Implementation Decisions (LOCKED)

### Daily quota
- **Limit: 50 messages per user per day.** Store as a single named constant (e.g. `CHAT_DAILY_LIMIT = 50` in `anthropic.server.ts` or a config const) so it is trivially adjustable.
- **Reset boundary: fixed UTC midnight.** The "day" key is the UTC calendar date as `YYYY-MM-DD` (e.g. `new Date().toISOString().slice(0,10)`). No client timezone is sent. (Greece UTC+2/+3 → reset ~02:00–03:00 local, acceptable.)
- **Persistence: MongoDB via Prisma**, NOT the in-memory `ratelimit.server.ts` map (which resets on cold start). Keep the existing in-memory `chat` burst limiter as the first gate; the Mongo daily cap is the ceiling checked after auth.
- **Enforcement point:** in `api.greg-ai.tsx` action, after `getUserId` + burst rate-limit, before creating/continuing the session. On exceed, return HTTP 429 with a localized JSON body; the widget renders a friendly "come back tomorrow" message (localized el/en).
- **Atomicity:** increment-and-check must be atomic (Prisma `upsert` + `increment`, or a findFirst→update guarded by the unique index) so concurrent requests can't overshoot.

### Daily usage model
- New Prisma model **`GregDailyUsage`**: `id`, `userId @db.ObjectId`, `date String` (UTC `YYYY-MM-DD`), `count Int @default(0)`, with `@@unique([userId, date])` and an index on `userId`. Read/written via a new helper in `gregChat.prisma.ts` (e.g. `incrementDailyUsage(userId) → { count, limitReached }`).

### Feedback
- **Storage: add `rating Int?` to `GregChatMessage`** (values: `-1` = 👎, `1` = 👍, `null`/unset = no rating). Single rater (the session owner). No separate model.
- **Endpoint:** new route `app/routes/api.greg-ai.feedback.tsx` — POST `{ messageId, rating }`, `getUserId` auth, ownership check (the message's session belongs to the user), `api`-bucket rate limit, writes `rating` via a `setMessageRating(messageId, userId, rating)` helper in `gregChat.prisma.ts`. Toggling the same rating clears it (sets 0/null).
- **UI:** 👍/👎 buttons under each **assistant** message bubble in `gregAiWidget.tsx`, optimistic update, selected state visually reflected. Only for persisted assistant messages (not the streaming placeholder).

### Localization
- All new user-facing strings (limit-reached message, rating aria-labels) added symmetrically to `public/locales/el/common.json` and `public/locales/en/common.json` as flat dotted keys under `gregAi.*` (matches existing convention; `keySeparator:false` is set).

### Deploy
- Requires `npm run prisma:generate` + `npm run prisma:push` (shared DB write) — user-gated per project convention. Include as a [BLOCKING] task after schema edits, before verification.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Greg AI foundation (patterns to match)
- `app/routes/api.greg-ai.tsx` — chat SSE endpoint; auth + burst rate-limit chain; where the daily cap check goes
- `app/routes/api.greg-ai.sessions.tsx` — analog for the new feedback route (GET/DELETE + auth + rate-limit shape)
- `app/utils/gregChat.prisma.ts` — data-access module; add usage + rating helpers here (match existing fn style, DTO types)
- `app/utils/anthropic.server.ts` — home for `CHAT_DAILY_LIMIT` const if kept with model config
- `app/utils/ratelimit.server.ts` — existing in-memory limiter (`chat` bucket added earlier); the daily cap complements it, does not replace it
- `components/gregAi/gregAiWidget.tsx` — chat UI; add rating buttons + limit-reached error handling
- `prisma/schema.prisma` — `GregChatSession` / `GregChatMessage` models; add `GregDailyUsage` + `rating` field

### Project conventions
- `CLAUDE.md` — data-access via `*.prisma.ts`, `.server.ts` suffix, i18n flat keys, security chain (CSRF/rate-limit/audit)
- `app/utils/i18n.server.ts` — localization helpers
- Design notes: `.planning/v1.2-ROADMAP.md` → Phase 8

</canonical_refs>

<specifics>
## Specific Ideas
- UTC day key: `new Date().toISOString().slice(0, 10)` — but note `Date.now()`/`new Date()` are fine in server code (this is not a workflow-script constraint).
- Rating toggle semantics: clicking the already-selected thumb clears the rating.
- Limit-reached response: 429 with `{ error, message, retryAfterHint }`; widget shows the localized message inline, disables the input until reset.
</specifics>

<deferred>
## Deferred Ideas
- Higher quotas tied to purchases (later; keep the const single-valued now).
- Multi-rater feedback / feedback audit trail (separate model) — deferred; `rating` field is enough.
- Analytics UI over ratings/usage — Phase 14.
</deferred>

---

*Phase: 08-guardrails-evidence*
*Context gathered: 2026-07-26 via interactive plan-phase decisions*
