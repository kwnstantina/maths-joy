# Requirements: GregKyrMaths

**Defined:** 2026-03-17
**Core Value:** Students can find, practice, and learn mathematics through exercises, videos, and books

## v1.1 Requirements

Requirements for current milestone. Each maps to roadmap phases.

### Q&A

- [x] **QA-01**: Student can ask question with title, body, category, and tags
- [x] **QA-02**: Anyone can answer a question
- [x] **QA-03**: Question author can accept best answer
- [x] **QA-04**: Users can upvote/downvote questions and answers
- [x] **QA-05**: Users can search and filter questions by category, tags, or text
- [x] **QA-06**: Q&A mutations have CSRF protection, rate limiting, and audit logging
- [x] **QA-07**: Users cannot vote on their own questions or answers

### Videos

- [ ] **VID-01**: Admin can upload YouTube video links with title, description, category, tags, creator name
- [ ] **VID-02**: Students can browse video tutorials by category

### Exercises

- [ ] **EX-01**: Admin can bulk upload multiple exercise PDFs at once
- [ ] **EX-02**: Exercises have improved category and tag organization
- [ ] **EX-03**: Students can search exercises by title, category, or tags
- [ ] **EX-04**: Exercise listing uses server-side pagination

### i18n

- [ ] **I18N-01**: All new features have Greek and English translations

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Videos

- **VID-03**: Embedded YouTube player on platform
- **VID-04**: Video progress tracking

### User Experience

- **UX-01**: User progress tracking across exercises and content
- **UX-02**: Purchase history page for students

### Q&A

- **QA-08**: Markdown support in Q&A posts
- **QA-09**: Reputation/badges system

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multiple teacher accounts | Single teacher (Greg) creates all content |
| Real-time notifications | Not needed for v1 |
| Mobile app | Web-first platform |
| Payment methods beyond Stripe | Stripe covers Greek/EU cards |
| Video hosting | Videos stay on YouTube, platform embeds them |
| Real-time Q&A updates | Unnecessary complexity for this scale |
| Q&A comment threads | Stack Overflow complexity not needed |
| Translating user-generated Q&A content | Only UI chrome gets i18n |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| QA-01 | Phase 3 | Complete |
| QA-02 | Phase 3 | Complete |
| QA-03 | Phase 3 | Complete |
| QA-04 | Phase 3 | Complete |
| QA-05 | Phase 4 | Pending |
| QA-06 | Phase 3 | Complete |
| QA-07 | Phase 3 | Complete |
| VID-01 | Phase 5 | Pending |
| VID-02 | Phase 5 | Pending |
| EX-01 | Phase 6 | Pending |
| EX-02 | Phase 6 | Pending |
| EX-03 | Phase 6 | Pending |
| EX-04 | Phase 6 | Pending |
| I18N-01 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after roadmap creation*
