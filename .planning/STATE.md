---
gsd_state_version: 1.0
milestone: none
milestone_name: Between milestones (v1.2 shipped)
status: between-milestones
stopped_at: v1.2 Greg AI Enhancement closed out. Privacy policy updated for Greg AI; Vercel Analytics rendered in root. Waiting for the user to define v1.3.
last_updated: "2026-10-25T00:00:00.000Z"
last_activity: 2026-10-25 -- Closed out v1.2 (docs reconciled with shipped Phases 9-14), privacy policy Greg AI disclosure, Vercel Analytics
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-25)

**Core value:** Students can find, practice, and learn mathematics through exercises, videos, and books
**Current focus:** Defining v1.3

## Current Position

Milestone: none active. v1.0, v1.1 and v1.2 shipped.
Status: v1.2 Greg AI Enhancement closed 2026-10-25. Phase 8 shipped via GSD plans; Phases 9-14
were built directly (no PLAN/VERIFICATION files) — `GREG_AI.md` is the feature reference and
`milestones/v1.2-ROADMAP.md` lists the deviations from the original design.
Last activity: 2026-10-25 -- v1.2 close-out + privacy policy + Vercel Analytics

Progress: v1.0 [██████████] 100% | v1.1 [██████████] 100% | v1.2 [██████████] 100%

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table. Greg AI specifics:

- Daily quota resets on a fixed **UTC** day; 50 msgs + `CHAT_DAILY_SPEND_BUDGET` per user (`app/utils/anthropic.server.ts`)
- Photos are never stored: shrunk in the browser, sent to the model once, transcribed into Greg's reply
- Chat stays on Haiku 4.5; model tiering and prompt caching deferred (`backlog/greg-model-tiering-and-caching.md`)
- Prefer zero-token buttons and reply markers over new tools (see `GREG_AI.md` → Cost)
- Vercel Analytics: `<Analytics />` in `app/root.tsx`, with `session_id`/`token`/`code`/`state` stripped from tracked URLs

### Pending Todos

- Enable **Web Analytics** for the project in the Vercel dashboard (the component only sends data once it is enabled)
- Set `GREG_AI_ENABLED` explicitly in Vercel and confirm `ANTHROPIC_API_KEY` and `RESEND_API_KEY` are present in production; verify a domain in Resend for `CONTACT_EMAIL_FROM`
- Legal compliance follow-ups in `docs/legal/COMPLIANCE.md` §4 (legal details in `app/utils/legalEntity.ts`, processor DPAs, Kit double opt-in, Stripe receipts, lawyer review)
- Human-verify Greg AI in a browser: daily cap state, 👍/👎 persistence, photo send, hint ladder, practice mode, `/admin/greg-ai`
- Human-verify the 6 items in `.planning/phases/06-exercise-improvements/06-VERIFICATION.md`

### Backlog

- `backlog/greg-credit-packs.md` — paid Greg AI usage via Stripe (dependencies now committed)
- `backlog/greg-model-tiering-and-caching.md` — GREGAI-10/11

### Blockers/Concerns

- Inline-edit UI on ExerciseCard does not expose level/type dropdowns (Phase 6 follow-up, never scheduled)
- Phase 6 tag filter uses Prisma `has` (exact, case-sensitive); EN-mode JSON-path search dropped (Prisma 5.22 limitation)
- Prisma is on 5.22.0; newer majors available
- Books section is hidden in nav/footer (commit 38c2311)
- No automated test suite

## Session Continuity

Last session: 2026-10-25
Stopped at: v1.2 closed; waiting for v1.3 direction from the user.
Resume file: None

**Next action:** `/gsd-new-milestone` once v1.3 scope is agreed.
