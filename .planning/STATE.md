---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Greg AI Enhancement
status: in-progress
stopped_at: Phase 8 (Guardrails & Evidence) complete and pushed. Live DB verified in sync (GregDailyUsage collection + unique [userId, date] index present). Phase 9 decisions resolved; ready for /gsd-plan-phase 9.
last_updated: "2026-08-30T00:00:00.000Z"
last_activity: 2026-08-30 -- Reconciled planning docs with shipped code; fixed repo-wide typecheck break (FormField.error prop); verified Greg AI schema live in Atlas
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 14
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-17)

**Core value:** Students can find, practice, and learn mathematics through exercises, videos, and books
**Current focus:** v1.2 Phase 9 -- Photo Input & Model Tiering (decisions resolved, ready to plan)

## Current Position

Milestone: v1.2 Greg AI Enhancement (Phases 8-14). v1.0 and v1.1 shipped.
Phase: 8 of 14 complete; Phase 9 is next and unplanned.
Status: Phase 8 shipped across all three plans (08-01 schema/data layer, 08-02 server enforcement +
feedback route, 08-03 widget UI). The `prisma db push` that 08-01 deferred is confirmed applied --
`GregDailyUsage` exists in Atlas `mathsDB` with `_id_`, `GregDailyUsage_userId_idx`, and the unique
`GregDailyUsage_userId_date_key` index. Daily cap = 50 msgs/user/UTC-day (`CHAT_DAILY_LIMIT` in
`app/utils/anthropic.server.ts`).
Last activity: 2026-08-30 -- doc reconciliation + typecheck fix

Progress: v1.0 [██████████] 100% | v1.1 [██████████] 100% | v1.2 [█░░░░░░░░░] 14%

## Performance Metrics

**By Phase:**

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Book Upload | v1.0 | 2/2 | Complete | 2026-03-08 |
| 2. Book Commerce | v1.0 | 3/3 | Complete | 2026-03-14 |
| 3. Q&A Core | v1.1 | 3/3 | Complete | 2026-03-17 |
| 4. Q&A Discovery | v1.1 | 1/1 | Complete | 2026-03-17 |
| 5. Video Tutorials | v1.1 | 2/2 | Complete | 2026-04-21 |
| 6. Exercise Improvements | v1.1 | 3/3 | Complete | 2026-04-21 |
| 7. i18n Completion | v1.1 | 4/4 | Complete | 2026-04-25 |
| 8. Guardrails & Evidence | v1.2 | 3/3 | Complete | 2026-08-28 |
| 9. Photo Input & Model Tiering | v1.2 | 0/TBD | Not started | - |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 8: daily quota resets on a fixed **UTC** calendar day (Greece UTC+2/+3, so ~02:00-03:00 local) -- avoids needing the client's timezone
- Phase 8: launch cap is 50 messages/user/day, single const `CHAT_DAILY_LIMIT` in `anthropic.server.ts`
- Phase 8: quota is checked AFTER the in-memory burst limiter and message validation, BEFORE session handling -- malformed/empty requests never consume quota
- Phase 8: the 429 body carries an error *code* (`daily_limit_reached`), not prose; the widget localizes it
- Phase 8: single-rater `rating Int?` on `GregChatMessage` rather than a separate feedback model -- multi-rater deferred
- Phase 8: no CSRF on `/api/greg-ai/*` routes, consistent with the sibling JSON APIs; auth + ownership check + rate limit carry the load
- Phase 8: 👍/👎 render only under *persisted* assistant bubbles (`!id.startsWith("local-")`); the `done` SSE event carries the server `messageId` so a just-streamed message is immediately rateable
- Phase 8: no `cache_control` on the system prompt -- Haiku 4.5's minimum cacheable prefix is 4096 tokens and the current prompt is well under it. Revisit in Phase 12 when tool defs + profile grow it
- Phase 9 (decided 2026-08-30): student photos upload to Cloudinary; the URL is stored on `GregChatMessage` and the image is sent to the model **only on the turn it was sent** -- later turns reference it as text. Prevents input-token cost compounding and keeps Mongo documents small
- Phase 9 (decided 2026-08-30): model tiering trigger is `hasImage` **only** -- no turn-count escalation. `pickModel({ hasImage })` returns Opus for image turns, Haiku otherwise. Revisit once 👍/👎 data shows where Haiku underperforms
- Feature flags read env per request (not cached at module load) so Vercel can toggle without a rebuild; unrecognised values fall back to the default rather than silently disabling (`featureFlags.server.ts`)

### Pending Todos

- Set `GREG_AI_ENABLED` explicitly in Vercel (currently unset -> defaults to `true`) and confirm `ANTHROPIC_API_KEY` is present in the production environment
- Human-verify Phase 8 in a browser: 50-message cap latches the localized "come back tomorrow" state and disables the composer; 👍/👎 persists and survives reload
- Human-verify the 6 items in `.planning/phases/06-exercise-improvements/06-VERIFICATION.md` (phase verification already `status: passed`, 9/10; these are live-browser checks)

### Blockers/Concerns

- Anthropic bill is now bounded by the daily cap only. Opus-on-image (Phase 9) raises per-message cost materially; watch spend after Phase 9 ships and retune `CHAT_DAILY_LIMIT` if needed.
- Inline-edit UI on ExerciseCard still does not expose level/type dropdowns -- the server accepts them but the admin-grid edit form does not write them. Ticketable follow-up from Phase 6, never scheduled.
- Phase 6 tag text filter uses Prisma `has` (exact element, case-sensitive); EN-mode JSON-path text search dropped for v1.1 (Prisma 5.22 MongoDB `JsonNullableFilter` supports only equals/not/isSet). Follow-up via `$runCommandRaw` if requested.
- Prisma is on 5.22.0; 8.0 is available. Not urgent, but the MongoDB JSON-filter limitation above is a 5.x constraint.
- Privacy policy must disclose chat review before Phase 14 ships (minors' data) -- blocking sub-task for that phase.

## Session Continuity

Last session: 2026-08-30
Stopped at: Planning docs reconciled with shipped code; Phase 9 decisions recorded.
Resume file: None

**Next action:** `/gsd-plan-phase 9` (Photo Input & Model Tiering). Both design decisions are recorded in v1.2-ROADMAP.md Phase 9.
