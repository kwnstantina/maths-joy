# Architecture Research: v1.1 Platform Completion

**Research type:** Ecosystem (architecture-focused)
**Confidence:** HIGH
**Date:** 2026-03-17

## Executive Summary

Most v1.1 features have significant existing code. Q&A routes, data access, and schema exist but lack the security chain (CSRF, rate limiting, audit). Video admin is complete but has no public routes. Bulk upload extends established streaming patterns. i18n is incremental key additions.

## Existing Architecture (Reference)

### Route Structure
- Flat file routing in `app/routes/`
- Q&A routes exist: `qa._index.tsx`, `qa.$questionId.tsx`, `qa.ask.tsx`
- Admin Q&A moderation: `admin.qa.tsx`
- Video admin: `admin.videos.tsx`
- Exercise admin: `admin.exercises.tsx`
- No public video browsing routes

### Data Access Layer
- `qa.server.ts` — Full Q&A CRUD, voting, search (exists)
- `video.prisma.ts` — Video CRUD (exists)
- `tutorial.server.ts` — Separate tutorial module (should consolidate into video.prisma.ts)
- Exercises use inline Prisma calls in route (no dedicated data access module)

### Prisma Schema (Existing Models)
- Question, Answer, QuestionVote, AnswerVote — all exist
- Video — exists but lacks `category` field
- Exersice (misspelled) — exists

## Integration Analysis

### Q&A Core (Phase 3)
**Existing:** Routes, data access, schema all present
**Missing:**
- CSRF protection on Q&A mutations (votes, answers, accepts, deletes)
- Rate limiting on Q&A actions
- Audit logging for Q&A operations
- Vote button UI components (currently DOM-injected forms)
- Edit question/answer UI (server functions exist, no UI)
- Sort options (newest, most voted, unanswered)

**New components needed:**
- `VoteButton` — useFetcher-based voting with optimistic UI
- `AnswerForm` — with CSRF token
- `QuestionCard` — for list display
- `AnswerCard` — with accept button for author
- `SortSelect` — for Q&A list sorting

### Q&A Discovery (Phase 4)
**Existing:** Basic search in `qa.server.ts`
**Missing:**
- Tag-based filtering UI
- Category filter (similar to book catalog pattern)
- Combined search + filter
- Pagination (currently loads all)

### Video Management (Phase 5)
**Existing:** `admin.videos.tsx` has complete CRUD with CSRF, audit, i18n
**Missing:**
- Public routes: `videos._index.tsx`, `videos.$videoId.tsx`
- YouTube embed component (~10 lines)
- Video model needs `category` field
- Consolidate `tutorial.server.ts` into `video.prisma.ts`
- YouTube URL validation (currently no domain check)

### Bulk Exercise Upload (Phase 6)
**Existing:** Streaming Cloudinary upload, admin exercise route
**Missing:**
- `bulkUploadExercise` action branch in `admin.exercises.tsx`
- `BulkExerciseUploadForm` component with `<input type="file" multiple>`
- Sequential streaming per file (not buffered formData)
- Exercise search (currently loads ALL exercises client-side)
- Server-side pagination for exercise listing

### i18n Completion (Phase 7)
**Existing:** 412 keys in each locale, fully synchronized
**Missing:** Translation keys for all new Q&A, video, and exercise UI text
**Note:** Pure content work, no infrastructure changes

## Suggested Build Order

1. **Q&A Security + Components** — Fix CSRF/rate-limit gaps, extract UI components, add sort
2. **Q&A Discovery** — Search, filter, pagination (builds on hardened Q&A)
3. **Video Public Routes** — Consolidate data layer, add public browsing, YouTube embed
4. **Bulk Exercise Upload + Search** — Extend admin route, add server-side search/pagination
5. **i18n Completion** — Add all new translation keys

## Anti-Patterns to Avoid

- Loading all records client-side (exercises._index.tsx pattern) — use server-side pagination
- Non-transactional vote count updates — wrap in `prisma.$transaction()`
- Raw YouTube URLs in iframes — extract video ID server-side
- Buffered formData for multiple files — use per-file streaming

---
*Research completed: 2026-03-17*
