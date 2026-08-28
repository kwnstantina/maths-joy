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

- [x] **EX-01**: Admin can bulk upload multiple exercise PDFs at once
- [x] **EX-02**: Exercises have improved category and tag organization
- [x] **EX-03**: Students can search exercises by title, category, or tags
- [x] **EX-04**: Exercise listing uses server-side pagination

### i18n

- [ ] **I18N-01**: All new features have Greek and English translations

## v1.2 Requirements (Greg AI Enhancement)

Requirements for the Greg AI tutor milestone (Phases 8-14). Detailed design notes: `v1.2-ROADMAP.md`.

### Greg AI

- [ ] **GREGAI-01**: Students can attach a photo of an exercise (camera or file) and Greg AI reasons over the image
- [ ] **GREGAI-02**: Per-user daily message quota, persisted (survives serverless restarts), with a friendly limit message
- [ ] **GREGAI-03**: Students can rate each assistant message 👍/👎, stored with the chat history
- [ ] **GREGAI-04**: Context-aware chat opener + exact exercise/topic passed into the system prompt on content pages
- [ ] **GREGAI-05**: Explicit hint-ladder UX (hint → another → show solution), each a hidden directive; hint depth logged
- [ ] **GREGAI-06**: Greg AI can search site content (exercises, videos, books) via tools and recommend real links
- [ ] **GREGAI-07**: Student profile from UserProgress injected into the system prompt; optional observation write-back
- [ ] **GREGAI-08**: Practice mode — generate problems as structured data, render as exercise cards, check step by step
- [ ] **GREGAI-09**: Teacher analytics admin page aggregating sessions by topic, hint depth, and give-up points
- [ ] **GREGAI-10**: Model tiering — route to a stronger model on image/long conversation; Haiku for the easy majority
- [ ] **GREGAI-11**: Prompt caching on the system block once it exceeds the model's cacheable minimum

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
| EX-01 | Phase 6 | Complete |
| EX-02 | Phase 6 | Complete |
| EX-03 | Phase 6 | Complete |
| EX-04 | Phase 6 | Complete |
| I18N-01 | Phase 7 | Pending |
| GREGAI-02 | Phase 8 | Pending |
| GREGAI-03 | Phase 8 | Pending |
| GREGAI-01 | Phase 9 | Pending |
| GREGAI-10 | Phase 9 | Pending |
| GREGAI-04 | Phase 10 | Pending |
| GREGAI-05 | Phase 10 | Pending |
| GREGAI-06 | Phase 11 | Pending |
| GREGAI-07 | Phase 12 | Pending |
| GREGAI-11 | Phase 12 | Pending |
| GREGAI-08 | Phase 13 | Pending |
| GREGAI-09 | Phase 14 | Pending |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-04-21 after 06-02 Tasks 1+2 completion (EX-01 marked complete; Task 3 human-verify checkpoint pending)*
