# Phase 3: Q&A Core - Research

**Researched:** 2026-03-17
**Domain:** Remix Q&A hardening -- security, useFetcher optimistic UI, transactional voting, inline editing
**Confidence:** HIGH

## Summary

Phase 3 hardens an existing Q&A system that already has complete routes (`qa._index.tsx`, `qa.$questionId.tsx`, `qa.ask.tsx`), a full data access layer (`qa.server.ts`), and working Prisma models. The gaps are well-defined: no CSRF protection on any Q&A mutation, no rate limiting, no audit logging, no self-vote prevention, voting uses DOM-injected form hacks instead of `useFetcher`, delete uses `confirm()` instead of a styled modal, no sort options on the question list, no inline editing UI, and `deleteQuestion` leaks AnswerVotes (deletes answers but not their votes).

The project already has all supporting infrastructure: `csrf.server.ts` (token generation + timing-safe validation), `ratelimit.server.ts` (in-memory with predefined types), `audit.server.ts` (MongoDB AuditLog), `@headlessui/react` v2 (for modals), and an established `useFetcher` + inline-editing pattern in `BookCard.tsx`. No new libraries are needed. The work is integration and refactoring, not greenfield.

**Primary recommendation:** Apply the established Phase 2 security chain (CSRF -> auth -> rate limit -> audit) to all Q&A actions, replace DOM form hacks with `useFetcher` + optimistic UI, wrap vote operations in `prisma.$transaction()`, and build a reusable confirmation modal using the existing headlessui Modal component as a base.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Voting UX:** Replace DOM-injected form hack with useFetcher + optimistic UI updates (vote count updates instantly, syncs in background). Vote toggle: clicking the same vote button undoes the vote (Stack Overflow behavior) -- already implemented server-side. Logged-out users see disabled vote buttons (current behavior, keep it). Self-vote: buttons appear disabled on own content, silent block (no error message). Accept answer also uses useFetcher for instant visual feedback (consistent with voting).
- **Security:** Add CSRF tokens to all Q&A mutations: ask, answer, vote, accept, edit, delete. Rate limiting uses existing types: 'api' (100/min) for votes and answers, 'contact' (3/hr) for asking questions. Audit logging for destructive actions only: deletes and admin moderation (votes/creates are too noisy). Self-vote prevention: server-side check (userId !== authorId) before processing vote. Vote operations wrapped in prisma.$transaction() to prevent count drift.
- **Delete Confirmation:** Replace browser confirm() with a custom modal component (not an alert -- a proper styled modal/toast). Modal for both question delete and answer delete.
- **Sort and Ordering:** Question list: two sort options -- Newest (default) and Most Voted. Sort control appears above the question list, inline tabs style (next to total count). Answer ordering: accepted answer pinned to top, rest sorted by vote count (current server behavior, keep it).
- **Edit Capability:** Include basic editing in this phase (server functions updateQuestion/updateAnswer already exist). Inline edit UI: click edit, content becomes editable in-place (like BookCard inline editing pattern). Uses useFetcher for inline editing (consistent with voting and BookCard pattern). Show "edited X ago" indicator next to timestamp when content has been modified. No time limit on editing -- authors can edit anytime.

### Claude's Discretion
- Exact modal component design (can reuse or create simple modal)
- Loading/error states during optimistic updates
- Edit form field layout for inline editing
- Whether to extract VoteButton as a shared component in /components/qa/

### Deferred Ideas (OUT OF SCOPE)
- Q&A category names i18n (hardcoded English) -- Phase 7 scope
- Markdown support in Q&A posts -- v2 requirement (QA-08)
- Q&A search and filtering improvements -- Phase 4 scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QA-01 | Student can ask question with title, body, category, and tags | Route `qa.ask.tsx` exists and works; needs CSRF + rate limiting added to action |
| QA-02 | Anyone can answer a question | Answer form in `qa.$questionId.tsx` exists; needs CSRF + rate limiting added |
| QA-03 | Question author can accept best answer | Accept action exists in `qa.$questionId.tsx`; needs CSRF + useFetcher migration |
| QA-04 | Users can upvote/downvote questions and answers | Vote actions exist but use DOM form hack; needs useFetcher + optimistic UI + $transaction |
| QA-06 | Q&A mutations have CSRF protection, rate limiting, and audit logging | No security on any Q&A route currently; established patterns in admin.books.tsx and contact.tsx |
| QA-07 | Users cannot vote on their own questions or answers | No self-vote check exists; need server-side guard + disabled UI for own content |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @remix-run/react | 2.x | useFetcher for optimistic UI | Project framework, already used in BookCard |
| @headlessui/react | ^2.2.0 | Dialog/Transition for confirmation modal | Already installed, used in existing modal component |
| prisma | (current) | $transaction for atomic vote operations | Already the ORM, $transaction is built-in |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-i18next | (current) | Translation keys for new UI strings | All user-facing text |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| headlessui Dialog | Raw HTML dialog element | headlessui already installed, provides animations and accessibility |
| In-memory rate limit | Redis | In-memory is fine for single-server Vercel deployment |

**Installation:** None required -- all dependencies already present.

## Architecture Patterns

### Recommended Project Structure
```
app/routes/
├── qa._index.tsx       # Add sort param handling to loader, sort tabs to UI
├── qa.$questionId.tsx  # Major refactor: useFetcher voting/accept/edit/delete, CSRF, modal
├── qa.ask.tsx          # Add CSRF + rate limiting to action
app/utils/
├── qa.server.ts        # Wrap vote ops in $transaction, add self-vote check, fix deleteQuestion
components/
├── qa/
│   └── ConfirmModal.tsx     # Delete confirmation modal (reuse headlessui pattern)
│   └── VoteButtons.tsx      # (optional) Extracted vote component with useFetcher
```

### Pattern 1: Security Chain (established in Phase 2)
**What:** CSRF -> Auth -> Rate Limit -> Business Logic -> Audit (for destructive actions)
**When to use:** Every Q&A action handler
**Example:**
```typescript
// Source: app/routes/admin.books.tsx (existing pattern)
// In loader:
const { token, headers } = await getCSRFToken(request);
return data({ csrfToken: token, ...otherData }, { headers });

// In action:
const formData = await request.formData();
const csrfToken = formData.get("_csrf") as string;
const isValid = await validateCSRFToken(request, csrfToken);
if (!isValid) return data({ error: "Invalid CSRF token" }, { status: 403 });

const rateLimitResponse = applyRateLimit(request, "api", userId);
if (rateLimitResponse) return rateLimitResponse;

// ... business logic ...

// For destructive actions only:
const { ipAddress, userAgent } = getClientInfo(request);
await logAuditEvent({ userId, action: "delete", resource: "question", resourceId, ipAddress, userAgent });
```

### Pattern 2: useFetcher Optimistic UI (established in BookCard)
**What:** Use `useFetcher` to submit forms without navigation, with optimistic local state
**When to use:** Voting, accept answer, inline editing, delete
**Example:**
```typescript
// Source: components/admin/BookCard.tsx (existing pattern)
const voteFetcher = useFetcher();

// Optimistic: derive display state from fetcher's pending submission
const optimisticVote = voteFetcher.formData
  ? parseInt(voteFetcher.formData.get("value") as string, 10)
  : userVote;
const optimisticCount = voteFetcher.formData
  ? calculateOptimisticCount(voteCount, userVote, parseInt(voteFetcher.formData.get("value") as string, 10))
  : voteCount;

<voteFetcher.Form method="post">
  <input type="hidden" name="_csrf" value={csrfToken} />
  <input type="hidden" name="_action" value="voteQuestion" />
  <input type="hidden" name="value" value="1" />
  <button type="submit" disabled={isOwnContent || !user}>...</button>
</voteFetcher.Form>
```

### Pattern 3: Prisma $transaction for Atomic Votes
**What:** Wrap vote CRUD + count update in a single transaction to prevent drift
**When to use:** All vote operations (voteQuestion, voteAnswer)
**Example:**
```typescript
// MongoDB transactions require replica set (Atlas has this by default)
export async function voteQuestion(questionId: string, userId: string, value: 1 | -1) {
  return prisma.$transaction(async (tx) => {
    const existingVote = await tx.questionVote.findUnique({
      where: { questionId_userId: { questionId, userId } },
    });

    if (existingVote) {
      if (existingVote.value === value) {
        await tx.questionVote.delete({ where: { id: existingVote.id } });
        await tx.question.update({ where: { id: questionId }, data: { voteCount: { decrement: value } } });
        return { action: 'removed', newValue: 0 };
      } else {
        await tx.questionVote.update({ where: { id: existingVote.id }, data: { value } });
        await tx.question.update({ where: { id: questionId }, data: { voteCount: { increment: value * 2 } } });
        return { action: 'changed', newValue: value };
      }
    }

    await tx.questionVote.create({ data: { questionId, userId, value, createdAt: new Date() } });
    await tx.question.update({ where: { id: questionId }, data: { voteCount: { increment: value } } });
    return { action: 'added', newValue: value };
  });
}
```

### Pattern 4: Confirmation Modal (headlessui)
**What:** Styled modal to replace browser `confirm()` for delete actions
**When to use:** Question delete and answer delete
**Example:**
```typescript
// Source: components/modal/modal.tsx (existing base pattern)
// Existing modal uses Dialog + Transition from @headlessui/react
// Build ConfirmModal on top: title, message, confirm/cancel buttons, onConfirm callback
// Trigger useFetcher.submit() from onConfirm handler
```

### Pattern 5: Inline Editing with useFetcher
**What:** Toggle between display and edit mode in-place, submit with useFetcher
**When to use:** Question edit and answer edit (author only)
**Example:**
```typescript
// Source: components/admin/BookCard.tsx (existing pattern)
const [isEditing, setIsEditing] = useState(false);
const editFetcher = useFetcher();

// Exit edit mode on success
useEffect(() => {
  if (editFetcher.data?.success) setIsEditing(false);
}, [editFetcher.data]);

// Edit mode renders a form; display mode renders content + edit button
```

### Anti-Patterns to Avoid
- **DOM-injected forms:** Current voting creates forms via `document.createElement('form')` and appends to `document.body`. This bypasses React, breaks CSRF (no token in the form), and causes full page reloads. Replace with `useFetcher.Form`.
- **Separate Prisma calls for vote + count update:** Current code does `prisma.questionVote.create()` then `prisma.question.update()` as separate awaits. If one fails the count drifts. Wrap in `$transaction`.
- **CSRF in action but not in loader:** Forgetting to call `getCSRFToken()` in the loader means forms have no token to send. Both loader and component must coordinate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal dialogs | Custom portal + focus trap | `@headlessui/react` Dialog | Accessibility (focus trap, aria, escape key) is hard to get right |
| CSRF protection | Custom token scheme | Existing `csrf.server.ts` | Already has timing-safe comparison, session storage |
| Rate limiting | Custom counter | Existing `ratelimit.server.ts` | Already has cleanup interval, typed presets |
| Optimistic UI state | Manual state management | `useFetcher.formData` for pending state | Remix handles revalidation automatically after mutation |

**Key insight:** Every infrastructure component needed for this phase already exists in the codebase. The work is wiring existing utilities into the Q&A routes, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: CSRF Token Not Reaching useFetcher Forms
**What goes wrong:** useFetcher forms submit but get 403 because CSRF token wasn't passed to the component.
**Why it happens:** The CSRF token comes from the loader via `getCSRFToken()`. If the loader doesn't return it, or the component doesn't pass it to child components, useFetcher forms lack the `_csrf` hidden input.
**How to avoid:** Always include `csrfToken` in the loader data, pass it through to all components that render forms. The `qa.$questionId.tsx` loader must call `getCSRFToken(request)` and return the token with the CSRF `Set-Cookie` header.
**Warning signs:** 403 errors on form submissions that work in the existing admin routes.

### Pitfall 2: Optimistic Vote Count Calculation Errors
**What goes wrong:** Vote count shows wrong number during optimistic update (e.g., double-counting or wrong direction).
**Why it happens:** Vote toggle has 3 states (none, upvote, downvote) and transitions between them change the count differently: new vote = +/-1, remove = -/+1, flip = +/-2.
**How to avoid:** Write a pure function `calculateOptimisticCount(currentCount, currentUserVote, newVoteValue)` that handles all 3 transitions. Derive optimistic state from `fetcher.formData` when a submission is pending, fall back to loader data when idle.
**Warning signs:** Count jumps by 2 when it should jump by 1, or doesn't revert on error.

### Pitfall 3: MongoDB Transaction Requirements
**What goes wrong:** `$transaction` throws "Transaction numbers are only allowed on a replica set member or mongos."
**Why it happens:** MongoDB transactions require a replica set. Local dev with a standalone mongod won't support them.
**How to avoid:** MongoDB Atlas (the project's database) supports transactions by default. For local dev, either use Atlas or run mongod as a replica set. Document this if anyone runs local MongoDB.
**Warning signs:** Transaction errors only in local development, never in staging/production.

### Pitfall 4: deleteQuestion Leaking AnswerVotes
**What goes wrong:** Deleting a question leaves orphaned AnswerVote records in the database.
**Why it happens:** Current `deleteQuestion` deletes Answers and QuestionVotes but does NOT delete AnswerVotes for those answers.
**How to avoid:** Before deleting answers, query all answer IDs for the question, then delete AnswerVotes where `answerId` is in that list. Do this inside the same function, ideally in a transaction.
**Warning signs:** Growing AnswerVote collection with `answerId` values that point to non-existent answers.

### Pitfall 5: useFetcher Revalidation After Voting
**What goes wrong:** After an optimistic vote, the page revalidates and briefly shows the old count before settling on the new count (flicker).
**Why it happens:** Remix revalidates all loaders after a mutation. If the loader re-fetches data before the DB write completes, it returns stale data momentarily.
**How to avoid:** This is why optimistic UI is important -- derive display state from `fetcher.formData` while `fetcher.state !== 'idle'`. Only fall back to loader data when the fetcher is idle (meaning revalidation has completed with fresh data).
**Warning signs:** Vote count briefly reverting after clicking, then settling to the correct value.

### Pitfall 6: Self-Vote Check Only Client-Side
**What goes wrong:** Malicious users bypass the disabled button and still vote on their own content.
**Why it happens:** Only disabling the button in the UI without a server-side check.
**How to avoid:** Add `userId !== authorId` check in the action handler BEFORE calling `voteQuestion`/`voteAnswer`. Return a 403 if they match. The UI disabled state is UX sugar, not security.
**Warning signs:** Users with vote records on their own content in the database.

## Code Examples

### CSRF Integration in Q&A Loader
```typescript
// qa.$questionId.tsx loader pattern
import { getCSRFToken } from "~/utils/csrf.server";

export const loader: LoaderFunction = async ({ params, request }) => {
  const { questionId } = params;
  // ... existing logic ...
  const { token, headers } = await getCSRFToken(request);

  return data(
    { question, answers, user, userVotes, csrfToken: token },
    { headers }
  );
};
```

### Self-Vote Prevention in Action
```typescript
case 'voteQuestion': {
  const value = parseInt(formData.get('value') as string, 10) as 1 | -1;
  if (![1, -1].includes(value)) {
    return data({ error: 'Invalid vote value' }, { status: 400 });
  }

  const question = await getQuestionById(questionId);
  if (question?.authorId === user.id) {
    return data({ error: 'Cannot vote on own content' }, { status: 403 });
  }

  await voteQuestion(questionId, user.id, value);
  return data({ success: true });
}
```

### Optimistic Vote Count Helper
```typescript
function calculateOptimisticCount(
  currentCount: number,
  currentUserVote: number, // 0, 1, or -1
  newVoteValue: number     // 1 or -1
): number {
  if (currentUserVote === newVoteValue) {
    // Toggle off: remove the vote
    return currentCount - newVoteValue;
  } else if (currentUserVote === 0) {
    // New vote
    return currentCount + newVoteValue;
  } else {
    // Flip: remove old, add new = change by 2x new direction
    return currentCount + newVoteValue * 2;
  }
}
```

### Sort Parameter in Question List Loader
```typescript
// qa._index.tsx loader addition
const sort = url.searchParams.get('sort') || 'newest';
const orderBy = sort === 'votes'
  ? { voteCount: 'desc' as const }
  : { createdAt: 'desc' as const };

// Pass orderBy to getQuestions (needs a new parameter)
```

### Edited Indicator
```typescript
// Compare createdAt vs updatedAt to show "edited" indicator
const wasEdited = new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 1000;
// Show: "edited 2 hours ago" next to the original timestamp
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DOM form injection for votes | useFetcher with optimistic UI | Remix v1.x+ (available since project start) | No page reload, instant feedback, CSRF-compatible |
| Separate Prisma calls | prisma.$transaction() | Prisma 4.x+ (available) | Atomic operations, no count drift |
| browser confirm() | headlessui Dialog | @headlessui/react already installed | Styled, accessible, consistent with app design |

**Deprecated/outdated:**
- DOM `document.createElement('form')` pattern in current VoteButtons: breaks with CSRF, causes full page reload, bypasses React lifecycle

## Open Questions

1. **Sort parameter in getQuestions**
   - What we know: `getQuestions` currently hardcodes `orderBy: { createdAt: 'desc' }`. Need to add a `sortBy` parameter.
   - What's unclear: Nothing -- straightforward to add.
   - Recommendation: Add optional `sortBy` parameter to `getQuestions` accepting 'newest' | 'votes'.

2. **VoteButton extraction**
   - What we know: VoteButtons is currently an inline component in `qa.$questionId.tsx`. With useFetcher, it becomes more complex (fetcher state, optimistic logic, CSRF).
   - What's unclear: Whether it's worth extracting to `components/qa/VoteButtons.tsx` or keeping inline.
   - Recommendation: Extract to `components/qa/VoteButtons.tsx` -- it's used for both questions and answers with identical logic, and the useFetcher version will be ~40-50 lines. This is marked as Claude's discretion.

3. **ConfirmModal design**
   - What we know: Existing `components/modal/modal.tsx` uses headlessui Dialog+Transition. It accepts title, children, isOpen, closeModal.
   - What's unclear: Whether to extend the existing modal or create a specialized ConfirmModal.
   - Recommendation: Create `components/qa/ConfirmModal.tsx` as a thin wrapper around the existing Modal that adds confirm/cancel buttons and an onConfirm callback. Keep the base modal unchanged.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- Read all Q&A routes, qa.server.ts, csrf.server.ts, ratelimit.server.ts, audit.server.ts, BookCard.tsx, modal.tsx, schema.prisma. All patterns verified by reading actual code.
- **admin.books.tsx and admin.qa.tsx** -- Established security chain pattern (CSRF + rate limit + audit) verified in working routes.
- **BookCard.tsx** -- useFetcher + inline editing pattern verified in working component.

### Secondary (MEDIUM confidence)
- **Prisma $transaction** -- MongoDB Atlas supports transactions (replica set required). The project uses Atlas per CLAUDE.md (`DATABASE_URL`). Interactive transactions with the callback API (`prisma.$transaction(async (tx) => {...})`) are the correct approach for MongoDB.

### Tertiary (LOW confidence)
- None -- all findings verified against codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in the project
- Architecture: HIGH -- all patterns verified against existing working code in the same codebase
- Pitfalls: HIGH -- identified from actual bugs in the current code (AnswerVote leak, DOM form hack, missing self-vote check)

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- no external library changes expected)
