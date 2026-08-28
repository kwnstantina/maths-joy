---
phase: 08-guardrails-evidence
plan: 03
status: complete
requirements: [GREGAI-02, GREGAI-03]
---

# Plan 08-03 Summary: Widget UI (rating + daily-limit)

## What was built
- `components/gregAi/gregAiWidget.tsx`:
  - `ChatMessage.rating?: number|null`; history load carries persisted `rating`.
  - `rateMessage()` — optimistic, toggling POST to `/api/greg-ai/feedback`, reconciles with server truth, reverts on error.
  - 👍/👎 controls rendered under **persisted** assistant bubbles only (`!m.id.startsWith("local-")`), with `aria-pressed` selected state; bubble restructured into a column so controls sit beneath.
  - `done` branch adopts the server `messageId` so a just-streamed message is immediately rateable.
  - `limitReached` state: a `429 daily_limit_reached` (read via `res.clone().json()` so burst 429s fall through unchanged) latches the localized `gregAi.limitReached` message and disables the textarea + send button; `startNewChat`/`loadSession` reset the latch.
- `public/locales/{el,en}/common.json`: added `gregAi.limitReached`, `gregAi.thumbsUpAria`, `gregAi.thumbsDownAria` (symmetric).

## Key files
- modified: `components/gregAi/gregAiWidget.tsx`, `public/locales/el/common.json`, `public/locales/en/common.json`

## Verification
- Typecheck + lint clean; both locale files valid JSON. All acceptance greps pass.
- Includes the plan-checker fix (`res.clone().json()`) so transient burst 429s keep their real message.

## Self-Check: PASSED
