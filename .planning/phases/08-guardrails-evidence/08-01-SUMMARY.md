---
phase: 08-guardrails-evidence
plan: 01
status: complete-pending-db-push
requirements: [GREGAI-02, GREGAI-03]
---

# Plan 08-01 Summary: Schema + Data Layer

## What was built
- `GregDailyUsage` model (`userId`, `date` UTC `YYYY-MM-DD`, `count`) with `@@unique([userId, date])` + `@@index([userId])`, and `rating Int?` on `GregChatMessage` — `prisma/schema.prisma`.
- `CHAT_DAILY_LIMIT = 50` exported from `app/utils/anthropic.server.ts`.
- `app/utils/gregChat.prisma.ts`: `incrementDailyUsage()` (atomic `upsert`+`increment`, UTC day key, `limitReached = count > 50`), `setMessageRating()` (ownership `role:"assistant", session:{userId}` + toggle-clears), `appendMessage()` now returns `{ id }`, `rating` threaded through `ChatMessageDTO` + `getSessionMessages` select.

## Key files
- created: (none — model added to existing schema)
- modified: `prisma/schema.prisma`, `app/utils/anthropic.server.ts`, `app/utils/gregChat.prisma.ts`

## Verification
- `prisma generate` ran (client v5.22.0 regenerated with new delegate/field). Typecheck clean.
- All Task 1/2 acceptance greps pass.

## Pending (user-gated)
- **Task 3 (BLOCKING): `npm run prisma:push`** to the shared MongoDB was intentionally deferred to the user (additive/non-destructive: new `GregDailyUsage` collection + nullable `rating`). Runtime queries against `gregDailyUsage` will fail until this runs.

## Self-Check: PASSED (code); DB push deferred to user
