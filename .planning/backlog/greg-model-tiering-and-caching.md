# Greg AI Model Tiering & Prompt Caching

**Status:** Backlog. Deferred from v1.2 (GREGAI-10, GREGAI-11).

## Model tiering (GREGAI-10)

Chat runs on `claude-haiku-4-5` for every turn (`GREG_AI_MODEL` in `app/utils/anthropic.server.ts`).
The 2026-08-30 plan was `pickModel({ hasImage })` → stronger model on photo turns only.

Decide with evidence first: use the `/admin/greg-ai` "Recent 👎 answers" list to see whether Haiku
fails mostly on photo turns or on hard multi-step problems. Raise `CHAT_DAILY_SPEND_BUDGET` math
accordingly — a stronger model on image turns costs materially more per message.

## Prompt caching (GREGAI-11)

No `cache_control` today (comment in `app/routes/api.greg-ai.tsx`): Haiku 4.5 only caches prefixes
of 4096+ tokens and the system prompt + tool definitions are under that. Revisit if the prompt grows
or if tiering moves image turns to a model with a lower cache minimum.
