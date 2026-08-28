# Roadmap: GregKyrMaths

## Overview

This roadmap extends an existing Remix + MongoDB platform (exercises, auth, chat, book e-commerce all working) by adding the remaining capabilities: a community Q&A system, admin video/exercise tooling, and full Greek/English translations.

## Milestones

- ✅ **v1.0 Book Platform** — Phases 1-2 (shipped 2026-03-17)
- 🚧 **v1.1 Platform Completion** — Phases 3-7 (in progress)
- 📋 **v1.2 Greg AI Enhancement** — Phases 8-14 (planned) — see [v1.2-ROADMAP.md](v1.2-ROADMAP.md) / [v1.2-REQUIREMENTS.md](v1.2-REQUIREMENTS.md)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v1.0 Book Platform (Phases 1-2) — SHIPPED 2026-03-17</summary>

- [x] Phase 1: Book Upload (2/2 plans) — completed 2026-03-08
- [x] Phase 2: Book Commerce (3/3 plans) — completed 2026-03-14

See: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### 🚧 v1.1 Platform Completion (Phases 3-7)

- [x] **Phase 3: Q&A Core** - Students ask questions, post answers, vote with security hardening, and accept best answers
- [x] **Phase 4: Q&A Discovery** - Students search and filter questions by category, tags, and text
- [ ] **Phase 5: Video Tutorials** - Admin manages YouTube links and students browse video tutorials by category
- [ ] **Phase 6: Exercise Improvements** - Bulk exercise upload, improved search, and server-side pagination
- [ ] **Phase 7: i18n Completion** - Full Greek and English translations for all new features

### 📋 v1.2 Greg AI Enhancement (Phases 8-14)

Detailed design notes (technical approach, key files, risks) per phase: [v1.2-ROADMAP.md](v1.2-ROADMAP.md).

- [ ] **Phase 8: Guardrails & Evidence** - Per-user daily message cap (Mongo-persisted) + 👍/👎 feedback on assistant messages
- [ ] **Phase 9: Photo Input & Model Tiering** - Snap-a-photo of an exercise + route images/long chats to a stronger model
- [ ] **Phase 10: Contextual Tutoring** - Exercise-aware system prompt + structured hint-ladder UX
- [ ] **Phase 11: Site-Aware Tools** - Tool use to search exercises/videos/books and recommend real links
- [ ] **Phase 12: Personalization & Prompt Caching** - UserProgress-driven system prompt + prompt caching
- [ ] **Phase 13: Practice Mode** - Structured-output problem generation rendered as exercise cards, with checking
- [ ] **Phase 14: Teacher Analytics Dashboard** - Admin aggregation of chat topics, hint depth, and give-up points

## Phase Details

### Phase 3: Q&A Core
**Goal**: Students can participate in a secure, production-ready Q&A community where questions get answered and the best answer rises to the top
**Depends on**: Phase 2
**Requirements**: QA-01, QA-02, QA-03, QA-04, QA-06, QA-07
**Success Criteria** (what must be TRUE):
  1. Logged-in student can post a question with title, body, category, and tags, and it appears in the question list
  2. Any logged-in user can post an answer to a question, and the question author can mark one answer as accepted
  3. Users can upvote or downvote questions and answers, with vote totals updating visibly -- but cannot vote on their own content
  4. All Q&A mutations (ask, answer, vote, accept) are protected by CSRF tokens, rate limiting, and audit logging
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Backend hardening (transactional voting, self-vote prevention, orphan cleanup) + VoteButtons and ConfirmModal components
- [x] 03-02-PLAN.md — Security chain on all Q&A routes + useFetcher refactor for voting, accept, and delete
- [x] 03-03-PLAN.md — Sort tabs on question list + inline editing with "edited" indicator

### Phase 4: Q&A Discovery
**Goal**: Students can find relevant questions through search and filtering without scrolling through everything
**Depends on**: Phase 3
**Requirements**: QA-05
**Success Criteria** (what must be TRUE):
  1. Student can search questions by text and see matching results
  2. Student can filter questions by category or tag
  3. Combined search and filter works together (e.g., filter by "Algebra" category AND search for "quadratic")
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md -- Filter UX polish (active filter bar, clear-all, unanswered toggle, differentiated empty states)

### Phase 5: Video Tutorials
**Goal**: Admin can build a tutorial library and students can browse and discover video tutorials by category
**Depends on**: Phase 2
**Requirements**: VID-01, VID-02
**Success Criteria** (what must be TRUE):
  1. Admin can add a YouTube video link with title, description, category, tags, and creator name
  2. Admin can edit or remove a video entry from the admin dashboard
  3. Students can browse a public video listing page with videos organized by category
  4. Student can click a video and watch it via embedded YouTube player or link
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md -- Schema fix (add category to Video model) + admin CRUD fix to persist category and fix tags
- [ ] 05-02-PLAN.md -- Public /videos route with category filtering + navigation link

### Phase 6: Exercise Improvements
**Goal**: Admin can upload exercises efficiently in bulk and students can find exercises through search and paginated browsing
**Depends on**: Phase 2
**Requirements**: EX-01, EX-02, EX-03, EX-04
**Success Criteria** (what must be TRUE):
  1. Admin can select and upload multiple exercise PDFs in a single operation with shared or per-file metadata
  2. Exercises are organized with consistent category and tag structure
  3. Student can search exercises by title, category, or tags and see relevant results
  4. Exercise listing uses server-side pagination instead of loading all records at once
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — Schema migration (tags String[] + level + type) + data-layer reshape + legacy migration script
- [x] 06-02-PLAN.md — Admin bulk upload (multi-file + shared metadata + partial-success retry) + level/type on single-upload form (all 3 tasks complete; human-verify approved 2026-04-21)
- [x] 06-03-PLAN.md — Public exercises: server-side pagination + URL-driven search/filters (Greek-canonical URL contract) + shared Pagination component

### Phase 7: i18n Completion
**Goal**: Every new feature introduced in v1.1 is fully accessible in both Greek and English
**Depends on**: Phases 3, 4, 5, 6
**Requirements**: I18N-01
**Success Criteria** (what must be TRUE):
  1. All Q&A interface text (ask, answer, vote, search, filter) displays correctly in both Greek and English
  2. All video listing and detail page text displays correctly in both Greek and English
  3. All exercise upload and search UI text displays correctly in both Greek and English
  4. Switching language on any new page works without untranslated strings appearing
**Plans**: 4 plans

Plans:
- [ ] 07-01-PLAN.md — Add all missing locale keys (Q&A UI + qa.errors.* + admin.qa.actions + admin.training image keys + exercises.download/pdfNotAvailable) symmetrically to el/common.json and en/common.json
- [ ] 07-02-PLAN.md — Q&A i18n retrofit: handle.i18n on 3 routes, Intl.RelativeTimeFormat for time-ago, action errors returned as error keys rendered via t()
- [ ] 07-03-PLAN.md — Admin Video upload form: swap to existing admin.videos.uploadButton/uploading keys (no new keys)
- [ ] 07-04-PLAN.md — Public /exercises/:pdfId retrofit (useTranslation + getLocalizedContent) + fix double-t() bug in ExerciseUploadForm and BulkExerciseUploadForm

### Phase 8: Guardrails & Evidence
**Goal**: Greg AI is safe to launch — a student cannot run up an unbounded bill, and every answer can be rated so future tuning is evidence-based
**Depends on**: Greg AI (shipped, commit 3f5b02b)
**Requirements**: GREGAI-02, GREGAI-03
**Success Criteria** (what must be TRUE):
  1. A user who exceeds the daily message limit is blocked on the next message with a friendly localized "come back tomorrow" message, and the count resets at the day boundary
  2. The quota persists across serverless cold starts (stored in Mongo, not the in-memory rate-limit map)
  3. Each assistant message shows 👍/👎 controls; a click persists the rating against that message and visibly reflects the selection
  4. Ratings and daily usage are queryable per user/session for later analytics (Phase 14)
**Design notes**: v1.2-ROADMAP.md → Phase 8
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md — Schema + data layer: GregDailyUsage model, rating field, quota/rating helpers, CHAT_DAILY_LIMIT, blocking prisma push
- [ ] 08-02-PLAN.md — Server enforcement: daily-cap 429 on chat endpoint + new api.greg-ai.feedback.tsx rating route
- [ ] 08-03-PLAN.md — Widget: 👍/👎 rating controls + localized daily-limit UI + el/en locale strings

### Phase 9: Photo Input & Model Tiering
**Goal**: A student can photograph an exercise and get help on it, and image/hard conversations are routed to a stronger model automatically
**Depends on**: Phase 8
**Requirements**: GREGAI-01, GREGAI-10
**Success Criteria** (what must be TRUE):
  1. Student can capture a photo or select an image in the widget, preview it, and send with or without text
  2. The image reaches the model as an image content block and Greg AI's reply references the pictured problem
  3. Oversized/unsupported images are rejected client- and server-side with a localized error, and each image counts toward the daily cap
  4. When an image is attached (or the conversation exceeds a turn threshold), a stronger model serves the request; plain short chats stay on Haiku
**Design notes**: v1.2-ROADMAP.md → Phase 9
**Plans**: TBD

### Phase 10: Contextual Tutoring
**Goal**: Greg AI knows which exercise/topic the student is on and offers a structured hint ladder instead of caving to "just give me the answer"
**Depends on**: Phase 8
**Requirements**: GREGAI-04, GREGAI-05
**Success Criteria** (what must be TRUE):
  1. On an exercise/training/book page, opening the widget shows a context-aware opener naming the current item
  2. The system prompt includes the exercise's title/topic/level so hints are specific without re-typing the problem
  3. Hint-ladder actions (hint → another → show solution) each send a hidden escalating directive
  4. Hint depth per session/topic is recorded (feeds Phase 14)
**Design notes**: v1.2-ROADMAP.md → Phase 10
**Plans**: TBD

### Phase 11: Site-Aware Tools
**Goal**: Greg AI answers topic questions with a hint plus real links to the site's exercises, videos, and books
**Depends on**: Phase 10
**Requirements**: GREGAI-06
**Success Criteria** (what must be TRUE):
  1. Greg AI can call search_exercises, search_videos, and find_book tools backed by existing Prisma modules
  2. A topic question yields a hint and, when relevant content exists, concrete links
  3. Tool calls stream through the existing SSE pipeline without breaking the delta/append UX
  4. Tools return only published/active content and never leak admin-only fields
**Design notes**: v1.2-ROADMAP.md → Phase 11
**Plans**: TBD

### Phase 12: Personalization & Prompt Caching
**Goal**: Greg AI adapts to the individual student using UserProgress, and the now-large system prompt is cached to control cost/latency
**Depends on**: Phase 11
**Requirements**: GREGAI-07, GREGAI-11
**Success Criteria** (what must be TRUE):
  1. The system prompt includes a one-line student summary from UserProgress when available
  2. Difficulty/references in answers visibly reflect the student's level
  3. With the enlarged prompt, cache_control is applied to the stable prefix and cache_read_input_tokens is non-zero on repeat turns
  4. (Optional) Greg AI can persist a short observation back to the student's profile/memory
**Design notes**: v1.2-ROADMAP.md → Phase 12
**Plans**: TBD

### Phase 13: Practice Mode
**Goal**: A student can request practice problems on a topic, answer them, and get step-by-step checking, rendered as exercise cards
**Depends on**: Phase 10
**Requirements**: GREGAI-08
**Success Criteria** (what must be TRUE):
  1. A "give me N exercises on X" request produces N generated problems as structured JSON
  2. Problems render as exercise-card UI, not raw chat text
  3. The student submits an answer per problem and Greg AI checks step by step, marking correct/incorrect with guidance
  4. Malformed generations are caught via schema validation and handled gracefully
**Design notes**: v1.2-ROADMAP.md → Phase 13
**Plans**: TBD

### Phase 14: Teacher Analytics Dashboard
**Goal**: Greg (the human) sees which topics generate the most questions, where students get stuck, and at what hint depth they give up
**Depends on**: Phase 8, Phase 10
**Requirements**: GREGAI-09
**Success Criteria** (what must be TRUE):
  1. An admin-only page aggregates chat sessions by topic/route context, message volume, and 👎 rate
  2. It surfaces hint-depth distribution per topic
  3. Access is restricted to admins (isAdmin) and the privacy policy discloses that chats may be reviewed
  4. The dashboard is read-only aggregation with no new PII exposure
**Design notes**: v1.2-ROADMAP.md → Phase 14
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14
Note: Phases 5 and 6 are independent of each other (both depend only on Phase 2). v1.2 (8-14) depends on the shipped Greg AI chatbot, not on Phases 3-7.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Book Upload | v1.0 | 2/2 | Complete | 2026-03-08 |
| 2. Book Commerce | v1.0 | 3/3 | Complete | 2026-03-14 |
| 3. Q&A Core | v1.1 | 3/3 | Complete | 2026-03-17 |
| 4. Q&A Discovery | v1.1 | 1/1 | Complete | 2026-03-17 |
| 5. Video Tutorials | v1.1 | 1/2 | In progress | - |
| 6. Exercise Improvements | v1.1 | 3/3 | Awaiting verification | - |
| 7. i18n Completion | v1.1 | 0/TBD | Not started | - |
