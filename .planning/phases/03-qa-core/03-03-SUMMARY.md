---
phase: 03-qa-core
plan: 03
subsystem: ui
tags: [sorting, inline-editing, useFetcher, relative-time, ux]

# Dependency graph
requires:
  - phase: 03-02
    provides: "CSRF-protected Q&A routes with useFetcher, VoteButtons, ConfirmModal"
provides:
  - "Sort tabs (Newest / Most Voted) on question list with URL param persistence"
  - "Inline editing for questions (title, body, category, tags) via useFetcher"
  - "Inline editing for answers (body) via useFetcher"
  - "Edited indicator showing relative time since last edit"
affects: [04-qa-discovery, 07-i18n-completion]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Inline editing with useFetcher + useState toggle, auto-exit on success via useEffect"]

key-files:
  created: []
  modified:
    - app/routes/qa._index.tsx
    - app/routes/qa.$questionId.tsx

key-decisions:
  - "Used Link-based sort tabs (not dropdown) matching existing category filter UX pattern"
  - "Default categories hardcoded in edit form matching qa.ask.tsx defaults"
  - "Relative time formatting via simple helper function instead of Intl.RelativeTimeFormat for broader compatibility"
  - "Edited detection threshold set to 1 second to avoid false positives from near-simultaneous timestamps"

patterns-established:
  - "Inline editing pattern: useState toggle + useFetcher.Form + useEffect exit on success"
  - "Edited indicator pattern: compare updatedAt vs createdAt with 1s threshold"

requirements-completed: [QA-01, QA-02, QA-03, QA-04]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 3 Plan 3: Q&A Sort Controls + Inline Editing Summary

**Sort tabs (Newest/Most Voted) on question list with inline editing for questions and answers plus "edited" relative-time indicators**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T16:11:51Z
- **Completed:** 2026-03-17T16:14:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Question list now supports sorting by Newest (default) or Most Voted via tab-style Link controls with URL search param persistence
- Question authors can inline-edit title, body, category, and tags without page reload using useFetcher
- Answer authors can inline-edit answer body without page reload using useFetcher
- Edited content shows "(edited X ago)" indicator with relative time formatting
- All edit actions are CSRF-protected, rate-limited, and authorization-checked (author-only)

## Task Commits

No commits made per user instruction. Changes are staged for review.

1. **Task 1: Add sort tabs to qa._index.tsx question list** - (no commit)
2. **Task 2: Add inline editing and "edited" indicator to qa.$questionId.tsx** - (no commit)

## Files Created/Modified
- `app/routes/qa._index.tsx` - Added sort URL param parsing in loader, sort tabs (Newest/Most Voted) as Link components, buildSortUrl helper preserving existing filters, sort value in loader return data
- `app/routes/qa.$questionId.tsx` - Added editQuestion/editAnswer action cases with author validation, inline edit forms for questions (title/body/category/tags) and answers (body) via useFetcher, "edited" indicator with relative time, Edit buttons visible only to content authors

## Decisions Made
- Used Link-based tab controls for sorting (consistent with category filter pattern) rather than a dropdown, keeping the UI minimal
- Hardcoded default categories in the question edit form matching qa.ask.tsx defaults, with fallback for custom categories not in the default list
- Used a simple relative time formatting helper instead of Intl.RelativeTimeFormat for straightforward implementation
- Set the "edited" detection threshold to 1 second (updatedAt - createdAt > 1000ms) to avoid false positives from near-simultaneous database timestamps

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - pre-existing TypeScript errors in uploadBook.tsx/uploadTutorial.tsx are unrelated and out of scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 (Q&A Core) is now complete with all 3 plans executed
- All Q&A features operational: voting, security chain, sorting, inline editing
- Ready for Phase 4 (Q&A Discovery) which builds on search/filter capabilities already present in the question list

## Self-Check: PASSED

- FOUND: .planning/phases/03-qa-core/03-03-SUMMARY.md
- FOUND: app/routes/qa._index.tsx (sort tabs with buildSortUrl, sort param in loader)
- FOUND: app/routes/qa.$questionId.tsx (editQuestion/editAnswer actions, wasEdited indicator, editing state)
- TypeScript: Only pre-existing errors in uploadBook.tsx/uploadTutorial.tsx (out of scope)

---
*Phase: 03-qa-core*
*Completed: 2026-03-17*
