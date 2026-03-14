# Roadmap: GregKyrMaths

## Overview

This roadmap extends an existing Remix + MongoDB platform (exercises, auth, chat all working) by adding the three capabilities that complete the teacher-student learning loop: a book e-commerce flow so students can purchase and download math textbooks; a community Q&A system where students ask questions and help each other; and admin-side tooling for videos and bulk exercise uploads. All features ship with full Greek/English translations.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Book Upload** - Admin can upload book PDFs with thumbnails, pricing, and metadata
- [ ] **Phase 2: Book Commerce** - Students browse, purchase, and download books via Stripe
- [ ] **Phase 3: Q&A Core** - Students ask questions, post answers, vote, and accept best answers
- [ ] **Phase 4: Q&A Discovery** - Students search and filter questions by category, tags, and text
- [ ] **Phase 5: Video Upload** - Admin manages YouTube tutorial links with categories and tags
- [ ] **Phase 6: Exercise Improvements** - Bulk exercise upload and improved search/filtering
- [ ] **Phase 7: i18n Completion** - Full Greek and English translations for all new features

## Phase Details

### Phase 1: Book Upload
**Goal**: Admin can build and manage a book catalog with full metadata and file assets
**Depends on**: Nothing (existing auth and Cloudinary integration handle prerequisites)
**Requirements**: BOOK-01
**Success Criteria** (what must be TRUE):
  1. Admin can upload a book PDF and thumbnail image via the upload dashboard
  2. Admin can set title, description, category, tags, and price for each book
  3. Uploaded book appears in the database and is visible in an admin book list
  4. Admin can edit or remove an existing book entry
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Schema extension, streaming Cloudinary upload, book data layer refactor (soft delete, archive)
- [x] 01-02-PLAN.md -- Admin book management route, upload form, card grid with inline editing, i18n

### Phase 2: Book Commerce
**Goal**: Students can find, purchase, and download math books through a complete Stripe payment flow with a dedicated checkout success page
**Depends on**: Phase 1
**Requirements**: BOOK-02, BOOK-03, BOOK-04, BOOK-05
**Success Criteria** (what must be TRUE):
  1. Student can browse the book catalog and filter by category
  2. Student can initiate a Stripe checkout session with Stripe Tax enabled and metadata (bookId, userId)
  3. After successful payment, user is redirected to a checkout success page that verifies payment status via backend (Stripe API), not client
  4. Checkout success page generates a time-limited Cloudinary signed URL for secure PDF download
  5. Success page uses useRevalidator() to poll for webhook completion if payment is still processing
  6. Purchase record stores only minimal payment data (last 4 digits, card brand) — no raw card numbers
  7. Download count enforcement and token expiry work on both success page and purchases page
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Catalog category filtering + purchase action security (CSRF, rate limiting, audit, Stripe Tax, metadata)
- [ ] 02-02-PLAN.md — Checkout success page with backend payment verification, Cloudinary signed URL, useRevalidator polling
- [ ] 02-03-PLAN.md — Webhook idempotency + download enforcement (count limits, token expiry, rate limiting)

### Phase 3: Q&A Core
**Goal**: Students can participate in a community Q&A where questions get answered and the best answer rises to the top
**Depends on**: Phase 2
**Requirements**: QA-01, QA-02, QA-03, QA-04
**Success Criteria** (what must be TRUE):
  1. Logged-in student can post a question with title, body, category, and tags
  2. Any user can post an answer to an open question
  3. Question author can mark one answer as accepted
  4. Users can upvote or downvote questions and answers, with vote totals visible
**Plans**: TBD

Plans: TBD

### Phase 4: Q&A Discovery
**Goal**: Students can find relevant questions without scrolling through everything
**Depends on**: Phase 3
**Requirements**: QA-05
**Success Criteria** (what must be TRUE):
  1. Student can search questions by text and see matching results
  2. Student can filter questions by category or tag
  3. Combined search and filter works together (e.g., filter by category AND search term)
**Plans**: TBD

Plans: TBD

### Phase 5: Video Upload
**Goal**: Admin can build a tutorial library by managing YouTube video links with metadata
**Depends on**: Phase 2 (upload dashboard patterns established)
**Requirements**: VID-01
**Success Criteria** (what must be TRUE):
  1. Admin can add a YouTube video link with title, description, category, tags, and creator name
  2. Added video is stored and visible in an admin video list
  3. Admin can edit or remove a video entry
**Plans**: TBD

Plans: TBD

### Phase 6: Exercise Improvements
**Goal**: Admin can upload exercises in bulk and students can find exercises through better search
**Depends on**: Phase 5
**Requirements**: EX-01, EX-02, EX-03
**Success Criteria** (what must be TRUE):
  1. Admin can select and upload multiple exercise PDFs in a single operation
  2. Exercises are organized with consistent category and tag structure
  3. Student can search exercises by title, category, or tags and see relevant results
**Plans**: TBD

Plans: TBD

### Phase 7: i18n Completion
**Goal**: Every new feature introduced in Phases 1-6 is fully accessible in both Greek and English
**Depends on**: Phase 6
**Requirements**: I18N-01
**Success Criteria** (what must be TRUE):
  1. All UI text for book catalog, purchase flow, and download pages is translated into both Greek and English
  2. All Q&A interface text (questions, answers, voting, search) is translated into both Greek and English
  3. All video upload and exercise upload/search UI text is translated into both Greek and English
  4. Language switch on any new page works without reverting to untranslated strings
**Plans**: TBD

Plans: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Book Upload | 2/2 | Complete | 2026-03-08 |
| 2. Book Commerce | 0/3 | Not started | - |
| 3. Q&A Core | 0/TBD | Not started | - |
| 4. Q&A Discovery | 0/TBD | Not started | - |
| 5. Video Upload | 0/TBD | Not started | - |
| 6. Exercise Improvements | 0/TBD | Not started | - |
| 7. i18n Completion | 0/TBD | Not started | - |
