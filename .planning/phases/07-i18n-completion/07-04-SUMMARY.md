---
phase: 07-i18n-completion
plan: 04
subsystem: i18n / exercises
tags: [i18n, exercises, pdf-viewer, admin-forms, bug-fix]
requirements: [I18N-01]

dependency_graph:
  requires:
    - 07-01 (locale keys: exercises.download, exercises.pdfNotAvailable already in EL + EN locale files)
    - app/utils/i18n.server.ts (getLocalizedContent, SupportedLanguage)
    - app/i18next.server.ts (i18next.getLocale)
    - components/admin/BilingualFields.tsx (consumer that calls t(labelKeyEl))
  provides:
    - Localized public PDF viewer at /exercises/:pdfId
    - Admin exercise single + bulk upload forms with correct BilingualFields key contract
  affects:
    - app/routes/exercises.$pdfId.tsx (4 changes: imports, handle, loader, 2 JSX strings)
    - components/admin/ExerciseUploadForm.tsx (4 lines: title + description prop pairs)
    - components/admin/BulkExerciseUploadForm.tsx (2 lines: description prop pair)

tech_stack:
  added: []
  patterns:
    - "locale-driven loader: i18next.getLocale(request) -> getLocalizedContent(item, locale)"
    - "BilingualFields contract: pass raw i18n key string, never pre-resolved t() value"

key_files:
  created: []
  modified:
    - app/routes/exercises.$pdfId.tsx
    - components/admin/ExerciseUploadForm.tsx
    - components/admin/BulkExerciseUploadForm.tsx

decisions:
  - "Double-t() fix at the callsites (form components), NOT inside BilingualFields - the component's documented contract IS 'pass a key', so the forms were the violators. Detection-via-heuristic inside BilingualFields would have been fragile."
  - "Used Parameters<typeof getLocalizedContent>[0] type-bridge in the PDF viewer loader because the Prisma Exersice model is not declared with the Translatable structural type but is structurally compatible at runtime. Same bridge already used in app/routes/videos._index.tsx for getLocalizedList."
  - "No locale JSON edits - 07-01 owns all common.json mutations; the exercises.download and exercises.pdfNotAvailable keys were already added there in EL and EN."
  - "useTranslation kept in both admin form files (used elsewhere for button labels, placeholders, etc.); only the labelKey* prop expressions were unwrapped."

metrics:
  start_time: "2026-04-25T18:46:00Z"
  duration: "~6min"
  task_count: 2
  file_count: 3
  completed_date: "2026-04-25"
---

# Phase 7 Plan 04: Exercise Surface i18n Completion Summary

Localized the public `/exercises/:pdfId` PDF viewer route end-to-end and fixed a double-`t()` bug in both admin exercise upload forms by switching from pre-resolved translations to raw key strings.

## What was done

### Task 1: Localize the public PDF viewer route

**File:** `app/routes/exercises.$pdfId.tsx`

Four atomic changes:

1. **Imports added** — `useTranslation` from `react-i18next`, `i18next` from `~/i18next.server`, plus `getLocalizedContent` and `SupportedLanguage` from `~/utils/i18n.server`. Reordered existing imports to satisfy the ESLint `import/order` rule (builtin → external → internal → parent → sibling, alphabetical inside each group).
2. **`handle` export added** — declares the `common` i18n namespace so `react-i18next` loads it for this route:
   ```typescript
   export const handle = { i18n: ["common"] };
   ```
3. **Loader updated** — now reads `request`, fetches the locale, and runs the fetched PDF through `getLocalizedContent` so the `title` field is swapped to the user's language before reaching the component:
   ```typescript
   export const loader: LoaderFunction = async ({ request, params }) => {
     const { pdfId } = params;
     const pdf = await getExersiceById(pdfId);
     if (!pdf) throw new Response("PDF not found", { status: 404 });

     const locale = (await i18next.getLocale(request)) as SupportedLanguage;
     const localizedPdf = getLocalizedContent(
       pdf as unknown as Parameters<typeof getLocalizedContent>[0],
       locale
     );
     return data(localizedPdf);
   };
   ```
4. **JSX hardcoded strings replaced** with `t()` calls:
   - Toolbar Download button: `Download` → `{t("exercises.download")}`
   - Empty-PDF fallback: `PDF not available` → `{t("exercises.pdfNotAvailable")}`

The `<strong>{data.title}</strong>` line is unchanged — it now automatically renders the locale-correct title because the loader already swapped `title` via `getLocalizedContent` before serializing the response.

### Task 2: Fix double-`t()` bug in admin exercise upload forms

**Files:** `components/admin/ExerciseUploadForm.tsx`, `components/admin/BulkExerciseUploadForm.tsx`

The bug: `BilingualFields` internally calls `t(labelKeyEl)` on its prop. The two exercise upload forms were passing `labelKeyEl={t("admin.exercises.titleEl")}`, which resulted in `t(t("admin.exercises.titleEl"))` = `t("Τίτλος (Ελληνικά)")` (Greek-canonical lookup miss → returns key back unchanged → label appeared frozen in Greek regardless of language toggle).

**ExerciseUploadForm.tsx — 4 lines, before/after:**

Title field (lines 66-67):
```diff
-               labelKeyEl={t("admin.exercises.titleEl")}
-               labelKeyEn={t("admin.exercises.titleEn")}
+               labelKeyEl="admin.exercises.titleEl"
+               labelKeyEn="admin.exercises.titleEn"
```

Description field (lines 77-78):
```diff
-               labelKeyEl={t("admin.exercises.descriptionEl")}
-               labelKeyEn={t("admin.exercises.descriptionEn")}
+               labelKeyEl="admin.exercises.descriptionEl"
+               labelKeyEn="admin.exercises.descriptionEn"
```

**BulkExerciseUploadForm.tsx — 2 lines, before/after:**

Shared description field (lines 136-137):
```diff
-               labelKeyEl={t("admin.exercises.descriptionEl")}
-               labelKeyEn={t("admin.exercises.descriptionEn")}
+               labelKeyEl="admin.exercises.descriptionEl"
+               labelKeyEn="admin.exercises.descriptionEn"
```

`useTranslation` and `const { t } = useTranslation()` were preserved in both files — `t()` is still called for unrelated labels (e.g., `t("admin.exercises.upload")`, `t("admin.exercises.uploadButton")`, `t("admin.exercises.bulkRetryFailed")`).

`components/admin/BilingualFields.tsx` was NOT modified — its contract is "pass a key" and it is correctly written. The bug lives at the callsites.

## Locale key consumption (no new keys added)

Both keys consumed by Task 1 already exist in both locale files (added by 07-01):

| Key                              | EL                                | EN                  |
| -------------------------------- | --------------------------------- | ------------------- |
| `exercises.download`             | Λήψη                              | Download            |
| `exercises.pdfNotAvailable`      | Το PDF δεν είναι διαθέσιμο        | PDF not available   |

Both keys for Task 2 were already used as VALUES inside `t(...)` and exist in both locale files:

| Key                                  | EL                       | EN                      |
| ------------------------------------ | ------------------------ | ----------------------- |
| `admin.exercises.titleEl`            | Τίτλος (Ελληνικά)        | Title (Greek)           |
| `admin.exercises.titleEn`            | Τίτλος (Αγγλικά)         | Title (English)         |
| `admin.exercises.descriptionEl`      | Περιγραφή (Ελληνικά)     | Description (Greek)     |
| `admin.exercises.descriptionEn`      | Περιγραφή (Αγγλικά)      | Description (English)   |

**Zero new locale keys added; zero changes to `public/locales/{el,en}/common.json` by this plan.**

## Decisions

### Double-`t()` fix at the callsites (not inside BilingualFields)

Per the orchestrator's note in the plan: the component contract IS "pass a key" — the forms are the violators. `VideoUploadForm.tsx` already passes raw key strings correctly (lines 65-66, 75-76); the exercise forms now match that convention.

Alternatives considered and rejected:
- **Detect inside `BilingualFields`** — would require checking whether the prop "looks like a key" (e.g., contains `.`) vs. a translated value, fragile and inverts the contract.
- **Rename the prop to `labelEl` / `labelEn` and accept resolved strings** — would force every callsite to call `t()` and lose the i18next reactive-language-change semantics that come from `t()` being called *inside* the rendering component.

### Type bridge in the loader

`getLocalizedContent<T extends Translatable>` requires the input to be structurally compatible with the `Translatable` interface from `app/utils/i18n.server.ts`. The Prisma `Exersice` model has the right shape at runtime (it has `title`, optional `description`, optional `category`, `tags`, optional `translation` JSON) but isn't declared with that exact structural type. The `Parameters<typeof getLocalizedContent>[0]` cast bridges the type without weakening the helper's signature — the same idiom is already used in `app/routes/videos._index.tsx`.

## Verification results

| Check | Command | Result |
| ----- | ------- | ------ |
| Task 1 imports + handle + i18n calls present | `grep -n "useTranslation\|getLocalizedContent\|exercises.download\|exercises.pdfNotAvailable\|export const handle" app/routes/exercises.\$pdfId.tsx` | 7 matches across imports, handle, loader, JSX |
| Task 1 hardcoded strings removed | `grep -nE "^\s*Download\s*$\|PDF not available" app/routes/exercises.\$pdfId.tsx` | 0 matches |
| Task 2 double-t() pattern eliminated | `grep -nE "labelKey(El\|En)=\{t\(" components/admin/ExerciseUploadForm.tsx components/admin/BulkExerciseUploadForm.tsx` | 0 matches |
| Task 2 raw key strings present | `grep -c 'labelKeyEl="admin.exercises\.' components/admin/ExerciseUploadForm.tsx components/admin/BulkExerciseUploadForm.tsx` | ExerciseUploadForm: 2, BulkExerciseUploadForm: 1 |
| Repo-wide audit (any other admin forms with the bug?) | `grep -rn "labelKey[EE]n\?=\{t(" components/admin/` | 0 matches |
| TypeScript typecheck (this plan's files) | `npm run typecheck` filtered to `exercises.$pdfId|ExerciseUploadForm|BulkExerciseUploadForm` | 0 errors |
| Production build | `npm run build` | OK — `exercises._pdfId-yKMvB0Ok.js` chunk emitted; "✓ built in 8.89s" |

### Pre-existing typecheck noise (out of scope)

`npm run typecheck` reports 6 pre-existing errors in `components/uploadExTabs/uploadBook.tsx` (lines 56, 68, 81, 94, 107, 119 — all `Type 'string | undefined' is not assignable to type 'string'`). These are unrelated to this plan:
- `uploadBook.tsx` is in the modified-list of the working tree but was modified BEFORE this plan started (and is unrelated to i18n).
- `app/routes/uploadEx.tsx` — the only consumer of the legacy `components/uploadExTabs/*` files — is now a 10-line redirect to `/admin`. Per the plan's `<output>` orphan-audit clause, the legacy tab components are confirmed out of scope.
- Per Scope Boundary in the executor rules: "Only auto-fix issues DIRECTLY caused by the current task's changes."

## Orphan audit (per plan output spec)

Confirmed out of scope:

| File                                          | Status                                           |
| --------------------------------------------- | ------------------------------------------------ |
| `components/uploadExTabs/uploadExercise.tsx`  | Legacy. Only referenced inside `uploadExTabs/` itself. Not imported by any route. |
| `components/uploadExTabs/uploadFile.tsx`      | Legacy. Same as above.                            |
| `components/uploadExTabs/uploadBook.tsx`      | Legacy. Same as above.                            |
| `components/uploadExTabs/uploadTutorial.tsx`  | Legacy. Same as above.                            |
| `components/input/input.tsx`                  | Only consumer is `app/routes/testYourself.tsx` (a separate self-test feature, not the v1.1 admin-upload flow). |
| `app/routes/uploadEx.tsx`                     | Now a redirect-only stub (`return redirect("/admin")`).  |

These will not break with the v1.1 admin-upload flow because they are not on the user path.

## Deviations from Plan

None — plan executed exactly as written. Edits were the surgical 4-edit + 6-line set the plan prescribed.

## Files modified

| File                                          | Lines changed |
| --------------------------------------------- | ------------- |
| `app/routes/exercises.$pdfId.tsx`             | +13 / -3      |
| `components/admin/ExerciseUploadForm.tsx`     | +4 / -4       |
| `components/admin/BulkExerciseUploadForm.tsx` | +2 / -2       |

## Self-Check: PASSED

- [x] `app/routes/exercises.$pdfId.tsx` exists and contains all 4 edits — verified by `grep -n` (7 matches for the new tokens, 0 matches for hardcoded strings).
- [x] `components/admin/ExerciseUploadForm.tsx` exists and the title + description prop pairs are now raw key strings — verified by `grep -c` (2 raw keys), and double-t() pattern grep returns 0.
- [x] `components/admin/BulkExerciseUploadForm.tsx` exists and the description prop pair is now a raw key string — verified by `grep -c` (1 raw key), and double-t() pattern grep returns 0.
- [x] `npm run build` completes cleanly.
- [x] No commits made (per user no-auto-commit policy and orchestrator override).
- [x] No edits to `public/locales/{el,en}/common.json` (those belong to 07-01).
- [x] No edits to `components/admin/BilingualFields.tsx` (correct consumer; bug was at callsites).
- [x] No edits to `.planning/STATE.md` or `.planning/ROADMAP.md` (per sequential_execution constraints).
