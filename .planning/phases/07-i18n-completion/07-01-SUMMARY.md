---
phase: 07-i18n-completion
plan: 01
subsystem: i18n
tags: [i18n, locale, foundation, wave-1]
requirements: [I18N-01]
dependency-graph:
  requires: []
  provides:
    - "30 new locale keys in BOTH public/locales/el/common.json AND public/locales/en/common.json"
    - "Symmetric key sets across el/en locale files (478 keys each)"
    - "Foundation for parallel-safe execution of 07-02, 07-03, 07-04 (no JSON contention)"
  affects:
    - "Plans 07-02 (Q&A i18n hardening), 07-03 (Admin Videos), 07-04 (Admin Training + public PDF) — all depend on these keys existing in both locales before code edits"
tech-stack:
  added: []
  patterns:
    - "Flat dot-namespace keys (e.g., qa.errors.titleTooShort) — preserves the existing single-level dictionary shape"
    - "Server-returned error-key pattern (qa.errors.*) — Plan 07-02 will return key strings from the action and let the route translate at the boundary"
key-files:
  created: []
  modified:
    - "public/locales/el/common.json (+30 keys; 448 → 478)"
    - "public/locales/en/common.json (+30 keys; 448 → 478)"
decisions:
  - "Did NOT add admin.videos.createButton / admin.videos.creating — Plan 07-03 will instead reuse the EXISTING admin.videos.uploadButton / admin.videos.uploading keys (orchestrator decision)"
  - "Did NOT add Q&A category seed keys (qa.categories.algebra, etc.) — default-category seeds (Algebra, Geometry, …) are user-generated content and stay untranslated per orchestrator decision"
  - "Did NOT add qa.time.* relative-time keys — Plan 07-02 will replace formatRelativeTime with Intl.RelativeTimeFormat, which uses runtime locale data and needs no keys"
  - "Kept existing qa.confirmDeleteQuestion / qa.confirmDeleteAnswer keys — added the new qa.deleteQuestionTitle/Message + qa.deleteAnswerTitle/Message alongside, since 07-02 needs separate title/message strings for the ConfirmModal component (the legacy single-string keys stay in place to avoid breaking any current callsite)"
  - "Added admin.training.replaceContentImage / admin.training.replaceSolutionImage as NEW keys instead of repurposing the existing admin.training.replaceContent / admin.training.replaceSolution — preserves the legacy keys for any current callsite and gives 07-04 a clean key the new copy can target"
metrics:
  duration: "~6min"
  completed-date: "2026-04-25"
  tasks-completed: 1
  files-modified: 2
  keys-added: 30
---

# Phase 7 Plan 01: Locale Key Foundation Summary

Added all 30 locale keys consumed by Plans 07-02, 07-03, and 07-04 to both `public/locales/el/common.json` and `public/locales/en/common.json`, keeping the flat dot-namespace shape and the symmetry invariant across the two files.

## What Was Done

Inserted 30 new keys, in 5 logical groups, into both locale JSON files:

| Group | Count | Namespace                                | Where inserted                                                |
| ----- | ----- | ---------------------------------------- | ------------------------------------------------------------- |
| A     | 8     | `qa.*` inline UI                         | After existing `qa.mostVoted` (end of qa block)               |
| B     | 17    | `qa.errors.*` action-error keys          | Immediately after Group A (still inside qa block)             |
| C     | 1     | `admin.qa.actions`                       | After existing `admin.qa.confirmDelete` (end of admin.qa)     |
| D     | 2     | `admin.training.replace{Content,Solution}Image` | After existing `admin.training.replaceSolution`        |
| E     | 2     | `exercises.download`, `exercises.pdfNotAvailable` | After existing `exercises.clearFilters`              |

Total: 8 + 17 + 1 + 2 + 2 = 30 new keys per file.

### Group A — Q&A inline UI keys (8)

| Key                          | Greek                                                                        | English                                                          |
| ---------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `qa.edit`                    | Επεξεργασία                                                                 | Edit                                                             |
| `qa.save`                    | Αποθήκευση                                                                  | Save                                                             |
| `qa.edited`                  | επεξεργάστηκε                                                               | edited                                                           |
| `qa.tagsPlaceholder`         | Ετικέτες χωρισμένες με κόμμα                                                | Comma-separated tags                                             |
| `qa.deleteQuestionTitle`     | Διαγραφή Ερώτησης                                                           | Delete Question                                                  |
| `qa.deleteQuestionMessage`   | Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ερώτηση; Η ενέργεια αυτή δεν μπορεί να αναιρεθεί. | Are you sure you want to delete this question? This action cannot be undone. |
| `qa.deleteAnswerTitle`       | Διαγραφή Απάντησης                                                          | Delete Answer                                                    |
| `qa.deleteAnswerMessage`     | Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την απάντηση; Η ενέργεια αυτή δεν μπορεί να αναιρεθεί. | Are you sure you want to delete this answer? This action cannot be undone. |

### Group B — Q&A action-error keys (17)

`qa.errors.questionIdRequired`, `qa.errors.mustBeLoggedIn`, `qa.errors.answerTooShort`, `qa.errors.cannotVoteOwn`, `qa.errors.onlyAuthorCanAccept`, `qa.errors.onlyAuthorCanDeleteQuestion`, `qa.errors.onlyAuthorCanDeleteAnswer`, `qa.errors.onlyAuthorCanEditQuestion`, `qa.errors.onlyAuthorCanEditAnswer`, `qa.errors.titleTooShort`, `qa.errors.titleTooLong`, `qa.errors.bodyTooShort`, `qa.errors.editBodyTooShort`, `qa.errors.selectCategory`, `qa.errors.unknownAction`, `qa.errors.createFailed`, `qa.errors.generic`.

These are intended for the server-returned error-key pattern in Plan 07-02: the action returns the key string (e.g. `{ errorKey: "qa.errors.titleTooShort" }`) and the route component translates at the boundary.

### Group C — Admin Q&A (1)

| Key                  | Greek      | English |
| -------------------- | ---------- | ------- |
| `admin.qa.actions`   | Ενέργειες  | Actions |

### Group D — Admin Training (2)

| Key                                    | Greek                                  | English               |
| -------------------------------------- | -------------------------------------- | --------------------- |
| `admin.training.replaceContentImage`   | Αντικατάσταση Εικόνας Περιεχομένου    | Replace Content Image |
| `admin.training.replaceSolutionImage`  | Αντικατάσταση Εικόνας Λύσης            | Replace Solution Image |

### Group E — Exercises public PDF viewer (2)

| Key                            | Greek                       | English            |
| ------------------------------ | --------------------------- | ------------------ |
| `exercises.download`           | Λήψη                        | Download           |
| `exercises.pdfNotAvailable`    | Το PDF δεν είναι διαθέσιμο  | PDF not available  |

## Final Key Counts

- `public/locales/el/common.json`: **478 keys** (up from 448)
- `public/locales/en/common.json`: **478 keys** (up from 448)
- Symmetric: el-only = ∅, en-only = ∅
- No duplicate keys in either file
- Both files parse as valid JSON

## Decisions

### Did NOT add `admin.videos.createButton` / `admin.videos.creating`

**Why:** Per orchestrator decision recorded in 07-RESEARCH.md, Plan 07-03 will swap the AdminVideoForm component to use the EXISTING `admin.videos.uploadButton` / `admin.videos.uploading` keys instead of introducing a new pair. This keeps the admin-videos namespace tight and reuses verified Greek/English copy already in production.

### Did NOT add `qa.categories.*` seed keys

**Why:** The default categories seeded into the database (Algebra, Geometry, Calculus, Statistics, Probability, Trigonometry) are treated as **user-generated content** in the data model — they live on the `Category` table and are returned via the loader, not via translation lookups. Per REQUIREMENTS scoping, only true UI chrome strings get locale keys; seed content stays in the canonical (Greek) form. If/when the team decides categories need localization, the right move is to add a `translation: { el, en }` JSON column on the Category model, not a static key set.

### Did NOT add `qa.time.*` relative-time keys

**Why:** Plan 07-02 will replace the existing `formatRelativeTime` helper with `Intl.RelativeTimeFormat`, which sources its locale data from the runtime ICU bundle (no app-level keys needed). Adding `qa.time.justNow`, `qa.time.minutesAgo`, etc. would be dead weight; they would never be referenced after 07-02 lands.

### Kept legacy `qa.confirmDeleteQuestion` / `qa.confirmDeleteAnswer` and added new `qa.delete{Question,Answer}{Title,Message}` alongside

**Why:** The legacy keys are single-string confirms ("Are you sure you want to delete this question?") that current code may still reference until 07-02 swaps the call sites. The new `*Title` / `*Message` pair feeds the ConfirmModal component which expects two distinct slots. Keeping both lets 07-02 migrate call sites incrementally without breaking the build at any step.

### Added `admin.training.replaceContentImage` / `replaceSolutionImage` as NEW keys (not repurposing the existing `replaceContent` / `replaceSolution`)

**Why:** The existing `admin.training.replaceContent` / `replaceSolution` keys are already in use somewhere in the admin-training UI; renaming them would be a cross-cutting change outside the scope of a foundation plan. The `*Image` suffix matches the new component copy planned by 07-04 (RESEARCH Finding 1, line item under admin.training) and disambiguates "replace content" (vague) from "replace content **image**" (precise).

## Verification

Ran the plan's automated verification one-liner at task completion:

```bash
$ node -e "<plan verification script>"
OK keys= 478
```

Also confirmed:
- `node -e "JSON.parse(...)"` on each file → both parse OK
- Raw line-based key count (catches duplicate keys that JSON.parse would silently overwrite) → 478 each, no duplicates
- Symmetry check: `el_keys.filter(k => !en.includes(k))` and the reverse → both empty arrays
- All 30 required keys present in both files

`npm run typecheck` was run; the only errors reported are pre-existing in `components/uploadExTabs/uploadBook.tsx` and are unrelated to this plan's edits (locale JSON files do not affect TypeScript types). Per scope boundary, those are out of scope and logged for follow-up; this plan modifies only the two `common.json` files.

## Deviations from Plan

None — plan executed exactly as written. The 5 groups, 30 keys, and Greek/English copy match the plan one-for-one. No bug fixes, no missing critical functionality, no blocking issues, no architectural changes.

## Self-Check: PASSED

- [x] `public/locales/el/common.json` exists and contains all 30 new keys
- [x] `public/locales/en/common.json` exists and contains all 30 new keys
- [x] Both files parse as valid JSON
- [x] Key sets are symmetric (478 ≡ 478, no one-sided keys)
- [x] No duplicate keys in either file
- [x] No code files modified by this plan
- [x] Plan's automated verification one-liner exits 0
- [x] No commits made (per orchestrator override) — both edits remain in working tree for user review

## Commits

None — sequential executor running with `<critical_no_commit_override>`. Both modified files are staged in the working tree for the user / parent agent to commit:

- `M public/locales/el/common.json`
- `M public/locales/en/common.json`
