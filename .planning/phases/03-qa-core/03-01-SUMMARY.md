---
phase: 03-qa-core
plan: 01
subsystem: api
tags: [prisma, transactions, voting, headlessui, react, optimistic-ui]

# Dependency graph
requires: []
provides:
  - "Atomic vote operations (voteQuestion, voteAnswer) with prisma.$transaction"
  - "Self-vote prevention server-side guard"
  - "AnswerVote orphan cleanup in deleteQuestion"
  - "sortBy parameter for getQuestions (newest/votes)"
  - "VoteButtons reusable component with useFetcher optimistic UI"
  - "ConfirmModal reusable component for delete confirmations"
affects: [03-02, 03-03]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Interactive prisma.$transaction for atomic multi-step operations", "useFetcher optimistic UI with pure helper function"]

key-files:
  created:
    - components/qa/VoteButtons.tsx
    - components/qa/ConfirmModal.tsx
  modified:
    - app/utils/qa.server.ts

key-decisions:
  - "Used 'as const' type assertions on return values for precise action type inference"
  - "Kept ConfirmModal aligned with existing modal.tsx headlessui v1 API pattern for consistency"

patterns-established:
  - "Transactional voting: all vote operations use prisma.$transaction with self-vote check first"
  - "Optimistic count helper: pure calculateOptimisticCount function exported separately for testability"

requirements-completed: [QA-04, QA-07]

# Metrics
duration: 10min
completed: 2026-03-17
---

# Phase 3 Plan 1: Q&A Data Layer + Components Summary

**Atomic transactional voting with self-vote guard, AnswerVote orphan cleanup, and VoteButtons/ConfirmModal reusable components**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-17T15:46:44Z
- **Completed:** 2026-03-17T15:56:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Wrapped voteQuestion and voteAnswer in prisma.$transaction for atomic vote+count operations
- Added self-vote prevention (userId !== authorId) to both vote functions, throwing before any DB write
- Fixed deleteQuestion to clean up AnswerVotes before answers (wrapped in $transaction)
- Added sortBy parameter to getQuestions supporting 'newest' and 'votes' ordering
- Created VoteButtons component with useFetcher, optimistic UI, and exported calculateOptimisticCount helper
- Created ConfirmModal component with headlessui Dialog, loading state, and danger styling

## Task Commits

Each task was committed atomically:

1. **Task 1: Harden qa.server.ts** - `e3c3999` (feat)
2. **Task 2: Create VoteButtons and ConfirmModal** - `7bb9a05` (feat)

## Files Created/Modified
- `app/utils/qa.server.ts` - Transactional voting, self-vote guard, orphan cleanup, sortBy parameter
- `components/qa/VoteButtons.tsx` - Reusable vote UI with useFetcher and optimistic updates
- `components/qa/ConfirmModal.tsx` - Styled delete confirmation modal with headlessui Dialog

## Decisions Made
- Used `as const` type assertions on vote return values for precise TypeScript inference of 'removed' | 'changed' | 'added'
- Kept ConfirmModal consistent with existing modal.tsx headlessui v1-compatible API (Dialog + Transition pattern) rather than v2-only API, since the project already uses this pattern
- Exported calculateOptimisticCount as a named export for potential testing and reuse

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- qa.server.ts ready with atomic operations for Plan 02 route-level refactor
- VoteButtons and ConfirmModal components ready to be imported in qa.$questionId.tsx
- Plan 02 can wire these components into routes with CSRF, rate limiting, and audit logging

---
*Phase: 03-qa-core*
*Completed: 2026-03-17*
