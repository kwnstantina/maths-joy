# Requirements: GregKyrMaths

**Defined:** 2026-02-21
**Core Value:** Students can find, practice, and learn mathematics through exercises, videos, and books

## v1 Requirements

Requirements for current milestone. Each maps to roadmap phases.

### Books & Payments

- [x] **BOOK-01**: Admin can upload book PDF with thumbnail, title, description, category, tags, price
- [ ] **BOOK-02**: Student can browse book catalog with categories
- [ ] **BOOK-03**: Student can purchase book via Stripe checkout
- [ ] **BOOK-04**: Stripe webhook processes payment and creates purchase record with download token
- [ ] **BOOK-05**: Student can download purchased book PDF (limited download count)

### Q&A

- [ ] **QA-01**: Student can ask question with title, body, category, and tags
- [ ] **QA-02**: Anyone can answer a question
- [ ] **QA-03**: Question author can accept best answer
- [ ] **QA-04**: Users can upvote/downvote questions and answers
- [ ] **QA-05**: Users can search and filter questions by category, tags, or text

### Videos

- [ ] **VID-01**: Admin can upload YouTube video links with title, description, category, tags, creator name

### Exercises

- [ ] **EX-01**: Admin can bulk upload multiple exercise PDFs at once
- [ ] **EX-02**: Exercises have improved category and tag organization
- [ ] **EX-03**: Students can search exercises by title, category, or tags

### i18n

- [ ] **I18N-01**: All new features have Greek and English translations

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Videos

- **VID-02**: Video listing page with categories and filtering
- **VID-03**: Embedded YouTube player on platform

### User Experience

- **UX-01**: User progress tracking across exercises and content
- **UX-02**: Purchase history page for students

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multiple teacher accounts | Single teacher (Greg) creates all content |
| Real-time notifications | Not needed for v1 |
| Mobile app | Web-first platform |
| Payment methods beyond Stripe | Stripe covers Greek/EU cards |
| Video hosting | Videos stay on YouTube, platform embeds them |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOOK-01 | Phase 1 | Complete |
| BOOK-02 | Phase 2 | Pending |
| BOOK-03 | Phase 2 | Pending |
| BOOK-04 | Phase 2 | Pending |
| BOOK-05 | Phase 2 | Pending |
| QA-01 | Phase 3 | Pending |
| QA-02 | Phase 3 | Pending |
| QA-03 | Phase 3 | Pending |
| QA-04 | Phase 3 | Pending |
| QA-05 | Phase 4 | Pending |
| VID-01 | Phase 5 | Pending |
| EX-01 | Phase 6 | Pending |
| EX-02 | Phase 6 | Pending |
| EX-03 | Phase 6 | Pending |
| I18N-01 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 — traceability filled after roadmap creation*
