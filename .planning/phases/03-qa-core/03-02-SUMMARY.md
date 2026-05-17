---
phase: 03-qa-core
plan: 02
subsystem: api
tags: [csrf, rate-limiting, audit-logging, useFetcher, optimistic-ui, security]

# Dependency graph
requires:
  - phase: 03-01
    provides: "VoteButtons, ConfirmModal components; atomic vote operations with self-vote guard"
provides:
  - "CSRF-protected Q&A ask route with rate limiting (contact: 3/hr)"
  - "CSRF-protected Q&A detail route with rate limiting on all actions"
  - "useFetcher-based voting via VoteButtons component (no DOM hacks)"
  - "ConfirmModal-based delete confirmations (no window.confirm)"
  - "Audit logging on question and answer deletions"
  - "Accept answer via useFetcher with optimistic accepted state"
affects: [03-03]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Security chain: CSRF validation before formData, rate limit after auth, audit on destructive ops"]

key-files:
  created: []
  modified:
    - app/routes/qa.ask.tsx
    - app/routes/qa.$questionId.tsx

key-decisions:
  - "Called requireCSRFToken before formData consumption (request.clone inside handles it)"
  - "Used targetId OR answerId fallback in voteAnswer action to support VoteButtons component field naming"
  - "Rate limit type 'contact' (3/hr) for asking questions, 'api' (100/min) for all other Q&A actions"

patterns-established:
  - "Security chain order: CSRF check -> auth check -> rate limit -> action logic -> audit (destructive only)"
  - "ConfirmModal + useFetcher.submit for all destructive actions replacing window.confirm"

requirements-completed: [QA-01, QA-02, QA-03, QA-06]

# Metrics
duration: 5min
completed: 2026-03-17
---

# Phase 3 Plan 2: Q&A Security Chain + useFetcher Refactor Summary

**CSRF protection, rate limiting, and audit logging on all Q&A routes with useFetcher-based VoteButtons and ConfirmModal replacing DOM hacks**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-17T16:02:26Z
- **Completed:** 2026-03-17T16:07:53Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- All Q&A mutations (ask, answer, vote, accept, delete) are now CSRF-protected and rate-limited
- Replaced inline VoteButtons with DOM createElement hacks with the reusable VoteButtons component from Plan 01
- Replaced window.confirm() delete dialogs with ConfirmModal component and useFetcher submission
- Added audit logging on question and answer deletion with IP and user agent tracking
- Accept answer now uses useFetcher with optimistic accepted-state border highlight

## Task Commits

No commits made per user instruction. Changes are staged for review.

1. **Task 1: Add CSRF and rate limiting to qa.ask.tsx** - (no commit)
2. **Task 2: Refactor qa.$questionId.tsx with useFetcher, security chain, VoteButtons, and ConfirmModal** - (no commit)

## Files Created/Modified
- `app/routes/qa.ask.tsx` - Added CSRF token in loader, requireCSRFToken + applyRateLimit(contact) in action, hidden _csrf input in form
- `app/routes/qa.$questionId.tsx` - Full refactor: CSRF/rate-limit security chain, VoteButtons component, ConfirmModal for deletes, useFetcher for accept, audit logging on deletes

## Decisions Made
- Called requireCSRFToken before request.formData() since the CSRF utility clones the request internally -- consuming formData first would break the clone
- Used fallback field name lookup (answerId || targetId) in voteAnswer action to support VoteButtons component which sends targetId
- Applied 'contact' rate limit (3/hr) for question creation vs 'api' (100/min) for other Q&A actions, per user decision from planning

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed requireCSRFToken signature mismatch**
- **Found during:** Task 1
- **Issue:** Plan specified `requireCSRFToken(request, formData)` but actual signature is `requireCSRFToken(request)` (clones internally)
- **Fix:** Used correct single-argument signature and ensured CSRF check runs before formData consumption
- **Files modified:** app/routes/qa.ask.tsx, app/routes/qa.$questionId.tsx
- **Verification:** TypeScript compiles, matches existing pattern in books.$bookId.tsx

**2. [Rule 1 - Bug] Added targetId fallback for VoteButtons compatibility**
- **Found during:** Task 2
- **Issue:** VoteButtons component sends field name `targetId` but action expected `answerId` for voteAnswer
- **Fix:** Added `(formData.get('answerId') || formData.get('targetId'))` fallback in voteAnswer case
- **Files modified:** app/routes/qa.$questionId.tsx
- **Verification:** Both field names resolve correctly

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None - pre-existing TypeScript errors in uploadBook.tsx/uploadTutorial.tsx are unrelated and out of scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Q&A security hardening complete (CSRF, rate limiting, audit logging)
- Ready for Plan 03-03: sort tabs on question list + inline editing
- VoteButtons and ConfirmModal components are fully wired and production-ready

---
*Phase: 03-qa-core*
*Completed: 2026-03-17*
