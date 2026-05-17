# Pitfalls Research: v1.1 Platform Completion

**Research type:** Ecosystem (pitfalls-focused)
**Confidence:** HIGH
**Date:** 2026-03-17

## Executive Summary

16 pitfalls identified across 4 severity tiers. Critical issues: vote count drift from non-transactional updates, missing CSRF on Q&A mutations, self-voting not prevented. All are fixable with existing infrastructure — no new packages needed.

## Critical Pitfalls

### PIT-01: Vote Count Drift (Q&A)
**Risk:** `voteQuestion()` and `voteAnswer()` in `qa.server.ts` perform vote CRUD and count updates as separate non-transactional Prisma calls. Concurrent votes cause count drift.
**Prevention:** Wrap vote operations in `prisma.$transaction()`.
**Phase:** 3 (Q&A Core)

### PIT-02: Missing CSRF on Q&A Mutations
**Risk:** Every other sensitive route uses `validateCSRFToken()`, but `qa.$questionId.tsx` skips it entirely for votes, answers, accepts, and deletes. Direct CSRF vulnerability.
**Prevention:** Add CSRF token to Q&A loader, validate in action (same pattern as books, admin).
**Phase:** 3 (Q&A Core)

### PIT-03: Self-Voting Allowed
**Risk:** Q&A vote actions never check if voter is the question/answer author. Users can upvote their own content, gaming the system.
**Prevention:** Check `userId !== authorId` before processing vote.
**Phase:** 3 (Q&A Core)

### PIT-04: Bulk Upload Memory Overflow
**Risk:** Multiple PDFs in one `formData()` call loads everything into memory. On Vercel serverless (limited memory), this will OOM with large batches.
**Prevention:** Use per-file streaming via `uploadStreamToCloudinary()` (already exists). Process files sequentially, not buffered. Set batch size limit.
**Phase:** 6 (Exercise Improvements)

## Moderate Pitfalls

### PIT-05: YouTube URL XSS
**Risk:** `validateVideoFields` only checks non-empty. No YouTube domain/format validation. Raw URLs in iframes create XSS risk.
**Prevention:** Extract YouTube video ID server-side (`/watch?v=ID` or `/embed/ID`), reconstruct safe embed URL. Reject non-YouTube URLs.
**Phase:** 5 (Video Upload)

### PIT-06: AnswerVote Orphans on Delete
**Risk:** `deleteQuestion()` deletes QuestionVote records but not AnswerVote records for that question's answers. Orphaned records accumulate.
**Prevention:** Delete AnswerVotes for all answers before deleting answers and question. Use transaction.
**Phase:** 3 (Q&A Core)

### PIT-07: Video Tags Stored Wrong
**Risk:** Video tags stored as single-element array (`[tags]` instead of `tags.split(',')`) in admin route. Will break tag-based filtering.
**Prevention:** Fix tag parsing in admin.videos.tsx action — split on comma and trim.
**Phase:** 5 (Video Upload)

### PIT-08: Exercise Fetch-All Anti-Pattern
**Risk:** `exercises._index.tsx` calls `getAllExcersices()` which loads ALL exercises. As content grows, this becomes a performance bottleneck and memory issue.
**Prevention:** Add server-side pagination and search to exercise listing.
**Phase:** 6 (Exercise Improvements)

### PIT-09: Rate Limit Conflict with Bulk Upload
**Risk:** Current `upload: 5/hr` rate limit will cap bulk uploads at 5 files total per hour. Bulk upload becomes unusable.
**Prevention:** Create separate `bulk_upload` rate limit type with higher threshold (e.g., 50/hr) or adjust upload limit for admin.
**Phase:** 6 (Exercise Improvements)

### PIT-10: No Rate Limiting on Q&A Actions
**Risk:** Q&A votes, answers, and questions have no rate limiting. Unlike every other action in the platform.
**Prevention:** Add rate limiting (use existing `ratelimit.server.ts` patterns).
**Phase:** 3 (Q&A Core)

## Minor Pitfalls

### PIT-11: Video Model Missing Category
**Risk:** Video model has no `category` field. Cannot implement category filtering on public video page without schema change.
**Prevention:** Add `category` field to Video model in Prisma schema, run `prisma db push`.
**Phase:** 5 (Video Upload)

### PIT-12: Q&A Categories Hardcoded English
**Risk:** Category names in Q&A ask form are hardcoded English strings. Will show English categories even in Greek mode.
**Prevention:** Use i18n translation keys for category names.
**Phase:** 7 (i18n Completion) or Phase 3 if addressed early

### PIT-13: No Audit Logging on Q&A
**Risk:** Admin routes have audit logging but Q&A actions (especially delete, accept) don't. Inconsistent security posture.
**Prevention:** Add audit logging for Q&A delete and moderation actions.
**Phase:** 3 (Q&A Core)

### PIT-14: Missing Video Public Routes
**Risk:** `admin.videos.tsx` has complete CRUD but no public routes exist. Students literally cannot see videos.
**Prevention:** Create `videos._index.tsx` and `videos.$videoId.tsx` public routes.
**Phase:** 5 (Video Upload)

### PIT-15: i18n Key Parity Not Enforced
**Risk:** 412 keys currently synchronized between el/en. No CI check means new features will silently break one locale.
**Prevention:** Add a simple script to compare key counts between locales. Run in CI or as pre-commit check.
**Phase:** 7 (i18n Completion)

### PIT-16: Tutorial/Video Module Duplication
**Risk:** `tutorial.server.ts` and `video.prisma.ts` are separate modules for the same data. Changes to one may not propagate.
**Prevention:** Consolidate into single `video.prisma.ts` data access module.
**Phase:** 5 (Video Upload)

## Pitfall Distribution by Phase

| Phase | Critical | Moderate | Minor | Total |
|-------|----------|----------|-------|-------|
| 3. Q&A Core | 3 | 2 | 2 | 7 |
| 5. Video Upload | 0 | 2 | 2 | 4 |
| 6. Exercise Improvements | 1 | 2 | 0 | 3 |
| 7. i18n Completion | 0 | 0 | 2 | 2 |

## Key Takeaway

Q&A security hardening (CSRF, self-vote prevention, rate limits, transactional votes) MUST come before Q&A launch. These are not polish items — they are security gaps that every other route in the platform has already addressed.

---
*Research completed: 2026-03-17*
