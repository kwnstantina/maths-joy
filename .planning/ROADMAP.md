# Roadmap: GregKyrMaths

## Overview

This roadmap extends an existing Remix + MongoDB platform (exercises, auth, chat, book e-commerce all working) by adding the remaining capabilities: a community Q&A system, admin video/exercise tooling, and full Greek/English translations.

## Milestones

- ✅ **v1.0 Book Platform** — Phases 1-2 (shipped 2026-03-17)
- 🚧 **v1.1 Platform Completion** — Phases 3-7 (in progress)

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

- [ ] **Phase 3: Q&A Core** - Students ask questions, post answers, vote with security hardening, and accept best answers
- [ ] **Phase 4: Q&A Discovery** - Students search and filter questions by category, tags, and text
- [ ] **Phase 5: Video Tutorials** - Admin manages YouTube links and students browse video tutorials by category
- [ ] **Phase 6: Exercise Improvements** - Bulk exercise upload, improved search, and server-side pagination
- [ ] **Phase 7: i18n Completion** - Full Greek and English translations for all new features

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
**Plans**: TBD

Plans: TBD

### Phase 4: Q&A Discovery
**Goal**: Students can find relevant questions through search and filtering without scrolling through everything
**Depends on**: Phase 3
**Requirements**: QA-05
**Success Criteria** (what must be TRUE):
  1. Student can search questions by text and see matching results
  2. Student can filter questions by category or tag
  3. Combined search and filter works together (e.g., filter by "Algebra" category AND search for "quadratic")
**Plans**: TBD

Plans: TBD

### Phase 5: Video Tutorials
**Goal**: Admin can build a tutorial library and students can browse and discover video tutorials by category
**Depends on**: Phase 2
**Requirements**: VID-01, VID-02
**Success Criteria** (what must be TRUE):
  1. Admin can add a YouTube video link with title, description, category, tags, and creator name
  2. Admin can edit or remove a video entry from the admin dashboard
  3. Students can browse a public video listing page with videos organized by category
  4. Student can click a video and watch it via embedded YouTube player or link
**Plans**: TBD

Plans: TBD

### Phase 6: Exercise Improvements
**Goal**: Admin can upload exercises efficiently in bulk and students can find exercises through search and paginated browsing
**Depends on**: Phase 2
**Requirements**: EX-01, EX-02, EX-03, EX-04
**Success Criteria** (what must be TRUE):
  1. Admin can select and upload multiple exercise PDFs in a single operation with shared or per-file metadata
  2. Exercises are organized with consistent category and tag structure
  3. Student can search exercises by title, category, or tags and see relevant results
  4. Exercise listing uses server-side pagination instead of loading all records at once
**Plans**: TBD

Plans: TBD

### Phase 7: i18n Completion
**Goal**: Every new feature introduced in v1.1 is fully accessible in both Greek and English
**Depends on**: Phases 3, 4, 5, 6
**Requirements**: I18N-01
**Success Criteria** (what must be TRUE):
  1. All Q&A interface text (ask, answer, vote, search, filter) displays correctly in both Greek and English
  2. All video listing and detail page text displays correctly in both Greek and English
  3. All exercise upload and search UI text displays correctly in both Greek and English
  4. Switching language on any new page works without untranslated strings appearing
**Plans**: TBD

Plans: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7
Note: Phases 5 and 6 are independent of each other (both depend only on Phase 2).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Book Upload | v1.0 | 2/2 | Complete | 2026-03-08 |
| 2. Book Commerce | v1.0 | 3/3 | Complete | 2026-03-14 |
| 3. Q&A Core | v1.1 | 0/TBD | Not started | - |
| 4. Q&A Discovery | v1.1 | 0/TBD | Not started | - |
| 5. Video Tutorials | v1.1 | 0/TBD | Not started | - |
| 6. Exercise Improvements | v1.1 | 0/TBD | Not started | - |
| 7. i18n Completion | v1.1 | 0/TBD | Not started | - |
