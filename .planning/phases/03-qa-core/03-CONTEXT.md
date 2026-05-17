# Phase 3: Q&A Core - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden the existing Q&A system with production-ready security (CSRF, rate limiting, audit logging), fix voting mechanics (self-vote prevention, transactional operations), improve UX (useFetcher with optimistic updates, sort options, inline editing), and add a custom confirmation modal for destructive actions. The Q&A routes, data access layer, and UI already exist — this phase fixes gaps and polishes.

</domain>

<decisions>
## Implementation Decisions

### Voting UX
- Replace DOM-injected form hack with useFetcher + optimistic UI updates (vote count updates instantly, syncs in background)
- Vote toggle: clicking the same vote button undoes the vote (Stack Overflow behavior) — already implemented server-side
- Logged-out users see disabled vote buttons (current behavior, keep it)
- Self-vote: buttons appear disabled on own content, silent block (no error message)
- Accept answer also uses useFetcher for instant visual feedback (consistent with voting)

### Security
- Add CSRF tokens to all Q&A mutations: ask, answer, vote, accept, edit, delete
- Rate limiting uses existing types: 'api' (100/min) for votes and answers, 'contact' (3/hr) for asking questions
- Audit logging for destructive actions only: deletes and admin moderation (votes/creates are too noisy)
- Self-vote prevention: server-side check (userId !== authorId) before processing vote
- Vote operations wrapped in prisma.$transaction() to prevent count drift

### Delete Confirmation
- Replace browser confirm() with a custom modal component (not an alert — a proper styled modal/toast)
- Modal for both question delete and answer delete

### Sort and Ordering
- Question list: two sort options — Newest (default) and Most Voted
- Sort control appears above the question list, inline tabs style (next to total count)
- Answer ordering: accepted answer pinned to top, rest sorted by vote count (current server behavior, keep it)

### Edit Capability
- Include basic editing in this phase (server functions updateQuestion/updateAnswer already exist)
- Inline edit UI: click edit, content becomes editable in-place (like BookCard inline editing pattern)
- Uses useFetcher for inline editing (consistent with voting and BookCard pattern)
- Show "edited X ago" indicator next to timestamp when content has been modified
- No time limit on editing — authors can edit anytime

### Claude's Discretion
- Exact modal component design (can reuse or create simple modal)
- Loading/error states during optimistic updates
- Edit form field layout for inline editing
- Whether to extract VoteButton as a shared component in /components/qa/

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `qa.server.ts`: Full CRUD — createQuestion, createAnswer, voteQuestion, voteAnswer, acceptAnswer, updateQuestion, updateAnswer, deleteQuestion, deleteAnswer, getUserVotes, getQuestions (with filters/pagination), getQuestionCategories, getPopularTags
- `qa._index.tsx`: Complete question list with search, category filter, tag filter, pagination (308 lines)
- `qa.$questionId.tsx`: Question detail with VoteButtons component, answer form, accept/delete UI (445 lines)
- `qa.ask.tsx`: Ask question form with categories, popular tags, tag input (323 lines)
- `admin.qa.tsx`: Admin Q&A moderation route (exists)
- `csrf.server.ts`: CSRF token generation + validation (established pattern)
- `ratelimit.server.ts`: In-memory rate limiting with predefined types
- `audit.server.ts`: Security event logging to MongoDB AuditLog
- BookCard inline editing pattern (useFetcher) in `components/admin/BookCard.tsx`

### Established Patterns
- Multi-action handler: `_action` field discriminator (used in books, admin routes)
- Security chain: CSRF → auth → rate limit → audit → business logic (from Phase 2)
- useFetcher for inline operations without page reload (BookCard pattern)
- i18n: `useTranslation()` + `t()` keys in common.json

### Integration Points
- Q&A routes already exist at `/qa`, `/qa/:id`, `/qa/ask`
- Loader data interfaces defined, action handler uses _action pattern
- Vote operations need wrapping in $transaction (currently separate Prisma calls)
- deleteQuestion missing AnswerVote cleanup (deletes answers and QuestionVotes but not AnswerVotes)
- Categories hardcoded in English in qa.ask.tsx — needs i18n (Phase 7 scope)

</code_context>

<specifics>
## Specific Ideas

- Delete confirmation should be a styled modal, not browser confirm() — "something nice, like a toast modal"
- Inline editing follows the BookCard pattern already established in the admin
- Voting should feel responsive (optimistic updates, instant count change)

</specifics>

<deferred>
## Deferred Ideas

- Q&A category names i18n (hardcoded English) — Phase 7 scope
- Markdown support in Q&A posts — v2 requirement (QA-08)
- Q&A search and filtering improvements — Phase 4 scope

</deferred>

---

*Phase: 03-qa-core*
*Context gathered: 2026-03-17*
