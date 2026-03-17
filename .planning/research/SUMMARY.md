# Project Research Summary

**Project:** GregKyrMaths v1.1 -- Platform Completion
**Domain:** Educational platform (math tutoring, single-teacher)
**Researched:** 2026-03-17
**Confidence:** HIGH

## Executive Summary

GregKyrMaths v1.1 is a completion milestone, not a greenfield build. The platform already has substantial infrastructure for every planned feature: Q&A routes, data access, and schema exist; video admin CRUD is fully built; streaming upload to Cloudinary works; and i18n covers 412 synchronized keys across Greek and English. The work is about composing existing primitives into user-facing features, hardening security gaps, and adding missing public routes. No new packages are required.

The recommended approach is security-first: the Q&A system has working features but lacks CSRF protection, rate limiting, and self-vote prevention -- gaps that every other route in the platform has already addressed. These must be fixed before Q&A goes live. After Q&A is hardened, the remaining features (video public routes, bulk exercise upload, i18n keys) follow established patterns with low risk.

The primary risks are: (1) vote count drift from non-transactional Prisma operations under concurrent use, (2) memory overflow on Vercel serverless if bulk uploads buffer entire formData instead of streaming per-file, and (3) subtle data bugs from video tags being stored as single-element arrays. All are fixable with existing tools -- transactions, sequential streaming, and a string split fix respectively.

## Key Findings

### Recommended Stack

No new packages. The existing stack covers every v1.1 feature. This was verified against actual codebase files, not assumed.

**Core technologies (all already installed):**
- **Remix 2 + Vite:** Full-stack framework with loaders/actions, `useFetcher` for optimistic vote UI
- **Prisma + MongoDB:** ORM with existing Q&A, Video, Exercise models; `$transaction()` available for vote atomicity
- **better-react-mathjax:** Math rendering in Q&A bodies (already a dependency)
- **xss:** HTML sanitization for user-generated Q&A content (already a dependency)
- **Cloudinary SDK:** Streaming upload via `uploadStreamToCloudinary()` for bulk exercises

**Explicitly rejected:** Rich text editors, full-text search engines, state management libraries, YouTube API SDKs, form libraries, file upload widgets. See STACK.md for rationale on each.

**One schema change required:** Add `category String` field to the Video model, then `prisma db push`.

### Expected Features

**Must have (table stakes):**
- Q&A with CSRF-protected voting, answer submission, and accept-best-answer
- Q&A question list with pagination (currently loads all)
- Public video listing with YouTube embeds and category filtering
- Bulk exercise upload with sequential streaming and progress indication
- i18n translation keys for all new UI surfaces

**Should have (differentiators):**
- Q&A sort by newest/most voted/unanswered
- Q&A search by text and filter by category/tags
- Edit own question/answer (server functions exist, need UI)
- Tag-based video filtering
- Server-side exercise search and pagination (fixes fetch-all anti-pattern)

**Defer (v2+):**
- Real-time Q&A updates, reputation/badges, comment threads on answers
- Video progress tracking, playlist management
- Drag-and-drop upload, auto-metadata extraction from PDFs
- Markdown editor for Q&A (plain text + MathJax sufficient)

### Architecture Approach

The architecture is additive -- new routes and components layered onto existing patterns. Q&A has the most existing code (routes + data layer + schema) but the most security gaps. Video has complete admin CRUD but zero public routes. Bulk upload extends a proven streaming pattern. i18n is pure content addition.

**Major components to build:**
1. **Q&A UI components** -- VoteButton (useFetcher optimistic), AnswerForm (CSRF), QuestionCard, AnswerCard, SortSelect
2. **Video public routes** -- `videos._index.tsx` listing, `videos.$videoId.tsx` detail with embed component
3. **Bulk upload action** -- New action branch in `admin.exercises.tsx` with sequential per-file streaming
4. **Translation keys** -- Incremental additions to `el/common.json` and `en/common.json`

**Key pattern:** Follow the admin.videos.tsx pattern (CSRF + audit + i18n) for all new mutation routes. It is the most complete reference implementation in the codebase.

### Critical Pitfalls

1. **Vote count drift (PIT-01)** -- Wrap `voteQuestion()`/`voteAnswer()` in `prisma.$transaction()`. Non-transactional updates will cause counts to diverge under concurrent use.
2. **Missing CSRF on Q&A mutations (PIT-02)** -- Add CSRF token to Q&A loader and validate in action. Every other mutation route has this; Q&A was skipped.
3. **Self-voting allowed (PIT-03)** -- Add `userId !== authorId` check before processing votes. Currently users can upvote their own content.
4. **Bulk upload memory overflow (PIT-04)** -- Use per-file sequential streaming, not buffered formData. Vercel serverless has limited memory.
5. **Video tags stored wrong (PIT-07)** -- Tags saved as `[tags]` (single element) instead of `tags.split(',')`. Will break all tag-based filtering.

## Implications for Roadmap

Based on research, suggested phase structure (5 phases):

### Phase 1: Q&A Security Hardening and Core Components
**Rationale:** Q&A has the most existing code AND the most security gaps. Security must come before launch. This phase has 3 critical pitfalls and 7 total -- it is the riskiest phase and should be tackled first.
**Delivers:** Production-ready Q&A with voting, answers, accept-best, sort options
**Addresses:** All Q&A table stakes from FEATURES.md, CSRF/rate-limit/audit gaps
**Avoids:** PIT-01 (vote drift), PIT-02 (missing CSRF), PIT-03 (self-voting), PIT-06 (orphaned votes), PIT-10 (no rate limiting), PIT-13 (no audit logging)

### Phase 2: Q&A Discovery
**Rationale:** Builds on hardened Q&A from Phase 1. Search, filter, and pagination complete the Q&A user experience. Depends on Phase 1 components being stable.
**Delivers:** Searchable, filterable, paginated Q&A
**Addresses:** Q&A differentiators (search, filter by category/tags, pagination)
**Avoids:** Loading all records client-side (moves to server-side pagination)

### Phase 3: Video Public Routes
**Rationale:** Admin CRUD is complete -- this phase only adds public-facing routes and a YouTube embed component. Requires schema change (add category field). Should consolidate tutorial.server.ts into video.prisma.ts to eliminate module duplication.
**Delivers:** Students can browse and watch videos with category/tag filtering
**Addresses:** All video table stakes, YouTube thumbnail extraction, tag filtering
**Avoids:** PIT-05 (YouTube URL XSS), PIT-07 (video tags stored wrong), PIT-11 (missing category field), PIT-16 (module duplication)

### Phase 4: Bulk Exercise Upload and Exercise Search
**Rationale:** Extends proven streaming upload pattern. Includes fixing the exercise fetch-all anti-pattern with server-side pagination -- a necessary improvement before content volume grows.
**Delivers:** Admin can upload multiple exercises at once; students get searchable/paginated exercise listing
**Addresses:** Bulk upload table stakes, exercise search differentiator, server-side pagination
**Avoids:** PIT-04 (memory overflow), PIT-08 (fetch-all anti-pattern), PIT-09 (rate limit conflict)

### Phase 5: i18n Completion
**Rationale:** Depends on all new routes/features being finalized. Pure content work -- adding translation keys for Q&A, video, and exercise UI. Also addresses category name hardcoding and adds a key parity check.
**Delivers:** Full Greek/English coverage for all v1.1 features
**Addresses:** All i18n table stakes, PIT-12 (hardcoded English categories), PIT-15 (key parity enforcement)
**Avoids:** Translating incomplete features (which causes rework)

### Phase Ordering Rationale

- **Security before features:** Q&A security hardening must precede Q&A launch. This is a non-negotiable ordering constraint.
- **Dependencies flow downward:** Q&A Discovery depends on Q&A Core components. i18n depends on all features being finalized.
- **Independent phases can overlap:** Video (Phase 3) and Exercise (Phase 4) have no dependencies on each other and could run in parallel if desired.
- **i18n is always last:** Translation keys should only be added after UI text is finalized to avoid rework.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Q&A Security):** Needs careful review of `qa.server.ts` vote transaction design and the exact CSRF integration points. The security chain is well-documented in the codebase (admin.videos.tsx is the reference), but the Q&A route structure is more complex with multiple action intents.
- **Phase 4 (Bulk Upload):** Needs validation of Vercel serverless memory limits and sequential streaming behavior under `unstable_parseMultipartFormData` with multiple files.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Q&A Discovery):** Search/filter/pagination is a well-established Remix pattern; the book catalog already implements it.
- **Phase 3 (Video Public):** Follows the exact same route pattern as the existing book and exercise public pages.
- **Phase 5 (i18n):** Pure key additions to JSON files following documented patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against actual codebase files. Zero new packages needed -- every feature maps to installed dependencies. |
| Features | HIGH | Based on direct codebase analysis of existing routes, models, and data access functions. Status (EXISTS/PARTIAL/MISSING) verified per feature. |
| Architecture | HIGH | Component boundaries and build order derived from actual route structure and data layer analysis. |
| Pitfalls | HIGH | All 16 pitfalls identified from code inspection (non-transactional votes, missing CSRF, wrong tag storage). None are speculative. |

**Overall confidence:** HIGH

### Gaps to Address

- **Vercel memory limits for bulk upload:** The streaming approach should work, but the exact memory ceiling for sequential multi-file processing under Vercel serverless is not confirmed. Test with 10 PDFs of varying size during Phase 4 implementation.
- **Vote transaction performance:** Using `prisma.$transaction()` for every vote adds latency. At current scale this is fine, but should be monitored if Q&A volume grows significantly.
- **tutorial.server.ts scope:** The relationship between tutorials and videos is not fully clear from research. Consolidation into video.prisma.ts needs careful review to avoid breaking existing tutorial routes if any exist.
- **Exercise search quality:** Prisma `contains` with `mode: insensitive` is adequate now but may need MongoDB Atlas Search if exercise volume grows past hundreds. This is a v2 concern.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `qa.server.ts`, `video.prisma.ts`, `admin.videos.tsx`, `admin.exercises.tsx`, `cloudinary.server.ts`, `validators.server.ts`, `i18n.server.ts`, `prisma/schema.prisma`, `package.json`
- Existing route structure: `qa._index.tsx`, `qa.$questionId.tsx`, `qa.ask.tsx`
- Translation files: `public/locales/el/common.json`, `public/locales/en/common.json`

### Secondary (MEDIUM confidence)
- Remix `useFetcher` optimistic update patterns (well-documented core framework feature)
- Prisma `$transaction()` for MongoDB (standard Prisma feature, documented)
- Vercel serverless memory constraints (general knowledge, not project-specific testing)

---
*Research completed: 2026-03-17*
*Ready for roadmap: yes*
