---
phase: 07-i18n-completion
plan: 02
subsystem: i18n / Q&A routes
tags: [i18n, qa, intl, error-keys, remix-handle]
requirements: [I18N-01]

dependency-graph:
  requires:
    - "07-01: locale keys (qa.* and qa.errors.*) added to public/locales/{el,en}/common.json"
  provides:
    - "Q&A user surface fully localized (EL/EN) — list, detail, ask"
    - "Server action errors as locale keys consumed via t() on client"
    - "Locale-aware relative-time labels via Intl.RelativeTimeFormat"
  affects:
    - app/routes/qa._index.tsx
    - app/routes/qa.$questionId.tsx
    - app/routes/qa.ask.tsx

tech-stack:
  added: []
  patterns:
    - "Native Intl.RelativeTimeFormat for locale-aware relative time (no new dep)"
    - "Server-returns-key + client-renders-via-t() i18n contract for action errors"
    - "Remix handle.i18n declaration for namespace loading"

key-files:
  created: []
  modified:
    - path: app/routes/qa._index.tsx
      change: "Added handle = { i18n: ['common'] } export"
    - path: app/routes/qa.$questionId.tsx
      change: "Added handle export, replaced formatRelativeTime with Intl.RelativeTimeFormat, converted 13 action error strings to keys, wrapped 3 client error renders with t(), stripped 17 2-arg t() fallbacks"
    - path: app/routes/qa.ask.tsx
      change: "Added handle export, converted 5 action error/fieldError strings to keys, wrapped 4 client error renders with t()"

decisions:
  - "Used Intl.RelativeTimeFormat with numeric:'auto' — gets 'χθες'/'yesterday' style labels naturally; no qa.time.* keys needed"
  - "Did not modify components/qa/{ConfirmModal,VoteButtons}.tsx — callers pass already-translated strings (per plan scope)"
  - "Did not seed default category translations — Q&A categories are user-generated content (per orchestrator note)"

metrics:
  duration: 8min
  completed: 2026-04-25
  tasks: 3
  files-modified: 3
  lines-changed: "+57 / -49"
---

# Phase 7 Plan 02: Q&A i18n Retrofit Summary

Completed Q&A i18n coverage by adding handle.i18n exports to all three routes, swapping `formatRelativeTime`'s hardcoded English for native `Intl.RelativeTimeFormat`, converting every action() error string to a `qa.errors.*` locale key (rendered client-side via `t()`), and removing all 2-arg `t('key', 'fallback')` calls now that 07-01 has the keys in both locales.

## Lines Changed Per File

| File | Insertions | Deletions | Net |
|------|-----------:|----------:|----:|
| app/routes/qa._index.tsx | +2 | 0 | +2 |
| app/routes/qa.$questionId.tsx | +43 | -41 | +2 |
| app/routes/qa.ask.tsx | +12 | -8 | +4 |
| **Total** | **+57** | **-49** | **+8** |

## Task 1 — handle.i18n + 2-arg t() stripping

**`handle = { i18n: ["common"] }`** added to all three routes (immediately after the import block, before the first interface):

| File | Line |
|------|-----:|
| app/routes/qa._index.tsx | 9 |
| app/routes/qa.ask.tsx | 11 |
| app/routes/qa.$questionId.tsx | 26 |

**2-arg `t('key','fallback')` calls removed** (all in qa.$questionId.tsx — the other two routes had no fallbacks):

| Line (before) | Call removed |
|--------------:|--------------|
| 385 | `t('qa.questionTitle', 'Title')` |
| 400 | `t('qa.questionBody', 'Body')` |
| 414 | `t('qa.category', 'Category')` |
| 433 | `t('qa.tags', 'Tags')` |
| 441 | `t('qa.tagsPlaceholder', 'Comma-separated tags')` |
| 453 | `t('qa.save', 'Save')` |
| 460 | `t('qa.cancel', 'Cancel')` |
| 497 | `t('qa.edited', 'edited')` |
| 509 | `t('qa.edit', 'Edit')` |
| 607 | `t('qa.save', 'Save')` (second occurrence) |
| 614 | `t('qa.cancel', 'Cancel')` (second occurrence) |
| 629 | `t('qa.edited', 'edited')` (second occurrence) |
| 640 | `t('qa.edit', 'Edit')` (second occurrence) |
| 716 | `t('qa.deleteQuestionTitle', 'Delete Question')` |
| 717 | `t('qa.deleteQuestionMessage', '…')` |
| 734 | `t('qa.deleteAnswerTitle', 'Delete Answer')` |
| 735 | `t('qa.deleteAnswerMessage', '…')` |

Verification: `grep -nE "(\W|^)t\('[a-zA-Z.]+',\s*'" app/routes/qa.{_index,ask,\$questionId}.tsx` returns zero matches.

## Task 2 — Intl.RelativeTimeFormat

**`useTranslation()` destructure updated** at line 293:
```diff
- const { t } = useTranslation();
+ const { t, i18n } = useTranslation();
```

**`formatRelativeTime` rewritten** (lines 334–347):
```typescript
const formatRelativeTime = (dateString: string) => {
  const lang = i18n.language?.startsWith('en') ? 'en' : 'el';
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return rtf.format(-diffDay, 'day');
  if (diffHr > 0) return rtf.format(-diffHr, 'hour');
  if (diffMin > 0) return rtf.format(-diffMin, 'minute');
  return rtf.format(-diffSec, 'second');
};
```

**Spot-check expected output** (with `numeric: 'auto'`):

| Diff | EL output | EN output |
|------|-----------|-----------|
| -1 day | "χθες" | "yesterday" |
| -2 days | "προχθές" | "2 days ago" |
| -3 hours | "πριν από 3 ώρες" | "3 hours ago" |
| -1 minute | "πριν από 1 λεπτό" | "1 minute ago" |
| -5 seconds | "πριν από 5 δευτερόλεπτα" | "5 seconds ago" |

`Intl.RelativeTimeFormat` is a native browser API supported by every Remix 2 target (Node 18+ and all current evergreen browsers); no new dependency.

## Task 3 — Action error keys

### qa.$questionId.tsx server-side mapping (action handler)

| Before | After (key) |
|--------|-------------|
| `'Question ID required'` (line 100) | `'qa.errors.questionIdRequired'` |
| `'You must be logged in'` (line 109) | `'qa.errors.mustBeLoggedIn'` |
| `'Answer must be at least 10 characters'` (line 123) | `'qa.errors.answerTooShort'` |
| `'Cannot vote on own content'` (line 143) | `'qa.errors.cannotVoteOwn'` |
| `'Cannot vote on own content'` (line 160) | `'qa.errors.cannotVoteOwn'` |
| `'Only question author can accept answers'` (line 174) | `'qa.errors.onlyAuthorCanAccept'` |
| `'Only question author can delete'` (line 186) | `'qa.errors.onlyAuthorCanDeleteQuestion'` |
| `'Only answer author can delete'` (line 212) | `'qa.errors.onlyAuthorCanDeleteAnswer'` |
| `'Only question author can edit'` (line 236) | `'qa.errors.onlyAuthorCanEditQuestion'` |
| `'Title must be at least 10 characters'` (line 248) | `'qa.errors.titleTooShort'` |
| `'Body must be at least 10 characters'` (line 251) | `'qa.errors.editBodyTooShort'` |
| `'Answer must be at least 10 characters'` (line 266, edit-answer path) | `'qa.errors.answerTooShort'` |
| `'Only answer author can edit'` (line 272) | `'qa.errors.onlyAuthorCanEditAnswer'` |
| `'Unknown action'` (line 280) | `'qa.errors.unknownAction'` |
| `'An error occurred'` (line 284, outer catch) | `'qa.errors.generic'` |

### qa.$questionId.tsx client-side renders wrapped

| Site | Before | After |
|------|--------|-------|
| `editQuestionFetcher` error display (line 449) | `{editQuestionFetcher.data.error}` | `{t(editQuestionFetcher.data.error)}` |
| `editAnswerFetcher` error display (line 603) | `{editAnswerFetcher.data.error}` | `{t(editAnswerFetcher.data.error)}` |
| Answer-form `actionData.error` (line 671) | `{actionData.error}` | `{t(actionData.error)}` |

### qa.ask.tsx server-side mapping (action handler)

| Before | After (key) |
|--------|-------------|
| `fieldErrors.title = 'Title must be at least 10 characters'` (line 87) | `'qa.errors.titleTooShort'` |
| `fieldErrors.title = 'Title must be less than 200 characters'` (line 90) | `'qa.errors.titleTooLong'` |
| `fieldErrors.body = 'Question body must be at least 30 characters'` (line 94) | `'qa.errors.bodyTooShort'` |
| `fieldErrors.category = 'Please select a category'` (line 98) | `'qa.errors.selectCategory'` |
| `error: 'Failed to create question'` (line 123) | `'qa.errors.createFailed'` |

### qa.ask.tsx client-side renders wrapped

| Site | Before | After |
|------|--------|-------|
| Top error banner (line 165) | `{actionData.error}` | `{t(actionData.error)}` |
| Title field error (line 189) | `{actionData.fieldErrors.title}` | `{t(actionData.fieldErrors.title)}` |
| Body field error (line 211) | `{actionData.fieldErrors.body}` | `{t(actionData.fieldErrors.body)}` |
| Category field error (line 237) | `{actionData.fieldErrors.category}` | `{t(actionData.fieldErrors.category)}` |

### Edge cases handled

- `voteQuestion` / `voteAnswer` `throw err` re-throws after the `'own'` check still bubble to the outer `catch (error)` and are converted to `'qa.errors.generic'` — preserved as-is.
- The `success: true` returns are untouched (no error path).
- No type-shape change to `ActionData` — `error?: string` and `fieldErrors?` still hold strings (now key-shaped). Conditional rendering (`actionData?.error && …`) prevents `t(undefined)` paths.

## Verification Results

| Check | Result |
|-------|--------|
| `grep "export const handle = { i18n:" app/routes/qa.{_index,ask,$questionId}.tsx` | 3 matches |
| `grep -E "(\\W|^)t\\('[a-zA-Z.]+',\\s*'" app/routes/qa.{_index,ask,$questionId}.tsx` | 0 matches |
| `grep "Intl.RelativeTimeFormat" app/routes/qa.$questionId.tsx` | 1 match (line 336) |
| `grep "const { t, i18n } = useTranslation" app/routes/qa.$questionId.tsx` | 1 match (line 293) |
| `grep -E "error:\\s*'[A-Z]" app/routes/qa.{$questionId,ask}.tsx` | 0 matches |
| `grep -c "qa.errors\\." app/routes/qa.$questionId.tsx` | 15 references |
| `grep -c "qa.errors\\." app/routes/qa.ask.tsx` | 5 references |
| `npm run typecheck` | 6 pre-existing errors in `components/uploadExTabs/uploadBook.tsx` (out of scope, baseline-confirmed via stash); 0 new errors |
| `npm run build` | client + server bundles compiled (`✓ built in 10.12s` + `✓ built in 1.35s`) |

## Orphan Audit

Per Plan Task 1 instructions, ran `grep -rn "components/qa/ConfirmModal" app/ components/`:
- Single match: `app/routes/qa.$questionId.tsx:4` — only consumer.
- `components/qa/VoteButtons` likewise only imported by `qa.$questionId.tsx`.

`components/qa/{ConfirmModal,VoteButtons}.tsx` confirmed OUT OF SCOPE: callers always pass already-translated strings (`title={t('qa.deleteQuestionTitle')}`, etc.). No behavior change required.

`components/uploadExTabs/*`, `components/training/trainingList.tsx`, `components/kbar/kbar.tsx` flagged in plan as Phase-7 orphans — confirmed they are imported only by non-Q&A routes (`testYourself*.tsx`); they are explicitly out of scope for this plan and unaffected by these changes.

## Notes on Untouched Items

- **Q&A default-category seeds** (`['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Number Theory', 'Other']` in qa.ask.tsx loader and qa.$questionId.tsx default-categories array) — left untranslated per orchestrator note (user-generated-content boundary; users may have already created questions with these as Greek strings).
- **Locale JSON files** — NOT modified (per sequential_execution constraint: 07-01 already added all keys; 07-04 working-tree changes preserved).
- **`components/qa/*`** — NOT modified (per plan scope).
- **STATE.md / ROADMAP.md** — NOT modified (per sequential_execution constraint; orchestrator handles).

## Self-Check

- File `app/routes/qa._index.tsx` exists: FOUND
- File `app/routes/qa.$questionId.tsx` exists: FOUND
- File `app/routes/qa.ask.tsx` exists: FOUND
- File `.planning/phases/07-i18n-completion/07-02-SUMMARY.md` exists: FOUND (this file)
- Build green: PASS
- Typecheck no new errors: PASS (pre-existing errors only, baseline-confirmed)
- All 3 plan automated `<verify>` blocks: PASS

## Self-Check: PASSED

No commits made (per user no-auto-commit policy). All changes left in working tree for user review.
