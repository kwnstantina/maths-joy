# Phase 7: i18n Completion - Research

**Researched:** 2026-04-21
**Domain:** Internationalization audit (remix-i18next + i18next) over v1.1 feature surface
**Confidence:** HIGH — all findings verified by direct source inspection. No new library choices; existing infrastructure is the standard stack.

## Summary

Phase 7 is an audit-and-patch phase, not a framework introduction. The project already runs `remix-i18next` + `i18next-fs-backend` server-side and `i18next-http-backend` + `i18next-browser-languagedetector` client-side against `public/locales/{el,en}/common.json`. The two locale files are already perfectly symmetric at the top level (zero asymmetry: `el_keys - en_keys = en_keys - el_keys = ∅`). The `getLocalizedContent()` / `getLocalizedList()` pipeline for DB-translated content (`Exersice`, `Video`, `Book`, `Training`) already exists and is correctly called in the v1.1 routes that matter for the user-facing surface (videos._index, exercises._index).

The remaining work falls into six concrete gaps, all in feature code rather than infrastructure:

1. **13 missing locale keys** used in code but absent from BOTH `el/common.json` and `en/common.json`. Eight are Q&A (all are `t('qa.x', 'English fallback')` calls, so EN renders as the fallback and EL silently shows English). Two are an incorrect Tutorial-form pair (`admin.videos.createButton` / `admin.videos.creating` — should have been `uploadButton`/`uploading` which DO exist). One is admin.qa.actions, and two are admin.training image-replacement labels.
2. **Three Q&A routes missing the `export const handle = { i18n: ["common"] }` namespace declaration** — `qa._index.tsx`, `qa.$questionId.tsx`, `qa.ask.tsx`. The page works because root.tsx already declares the namespace, but routes spawning server-side translations should declare their own per Remix convention.
3. **Hardcoded strings bypassing `t()`** in 5 locations: `exercises.$pdfId.tsx` (no i18n at all — "Download" / "PDF not available" + title rendered raw), `qa.$questionId.tsx` (`formatRelativeTime` returns `"2 days ago"` / `"just now"` in English only; hardcoded Q&A category seed list `['Algebra','Geometry',…]`), `qa.ask.tsx` (same category seed list), and `qa.$questionId.tsx`'s action error messages returned from server (`"Cannot vote on own content"`, `"Only question author can accept answers"`, `"Answer must be at least 10 characters"`, etc.).
4. **Double-translation bug** in `ExerciseUploadForm` + `BulkExerciseUploadForm`: both pass `t("admin.exercises.titleEl")` as the `labelKeyEl` prop to `BilingualFields`, which then calls `t()` on the already-resolved Greek string. Works by accident (i18next returns the unknown key as-is), but breaks EN language switching on those specific labels. VideoUploadForm and TrainingUploadForm pass raw key strings correctly.
5. **Legacy `components/uploadExTabs/*.tsx` and `components/card/card.tsx` and `components/kbar/kbar.tsx` have hardcoded Greek labels** (e.g., `label="Επιλογή Τάξης"`, `alt="Γρηγόρης Κυρτσιάς"`, `heading: "Ασκήσεις"`). The uploadExTabs files are orphaned legacy (admin uses the newer `components/admin/*UploadForm.tsx` family); card.tsx is still actively used by `exercises._index.tsx`. Decision point for planner: scope-in legacy cleanup or leave orphans alone.
6. **Dropdown category labels on `/qa` sidebar and `/qa/ask` come from user-generated DB data + a hardcoded English seed list** — intentional per the "Out of scope: translating user-generated Q&A content" rule in REQUIREMENTS.md. Confirmed in-scope boundary, documented below.

**Primary recommendation:** Split into 3 parallelizable feature-area plans (Q&A, Videos, Exercises/Admin) + 1 shared-locale-keys plan that runs first (Wave 0). The shared Pagination and SearchInput components are already fully translated; no cross-cutting component-level work is needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| I18N-01 | All new features have Greek and English translations | All findings below; success criteria 1-4 decompose into the 6 audit sections. |

**Success criteria decomposition:**

| Criterion | Research locates work in… |
|-----------|--------------------------|
| SC1: Q&A interface text in both EL/EN | `qa._index.tsx`, `qa.$questionId.tsx`, `qa.ask.tsx`, `components/qa/*` — Section 3 below |
| SC2: Video listing/detail in both EL/EN | `videos._index.tsx`, `components/admin/VideoUploadForm.tsx`, `components/admin/VideoCard.tsx` — Section 4 below |
| SC3: Exercise upload + search UI in both EL/EN | `exercises._index.tsx`, `exercises.$pdfId.tsx`, `components/admin/ExerciseUploadForm.tsx`, `components/admin/BulkExerciseUploadForm.tsx`, `components/admin/ExerciseCategorySelect.tsx`, `components/admin/ExerciseCard.tsx`, `components/search/searchInput.tsx`, `components/card/card.tsx` — Section 5 below |
| SC4: Language switching works without untranslated strings | Section 6 (language-switch robustness) + all missing-key fills |
</phase_requirements>

## Standard Stack (already in use — DO NOT swap)

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `remix-i18next` | 7.0.1 (installed) | Remix loader/cookie integration for i18next | Official Remix i18n adapter |
| `i18next` | (peer) | Translation engine | Ecosystem-standard |
| `react-i18next` | (peer) | React hooks (`useTranslation`) | Ecosystem-standard |
| `i18next-fs-backend` | (peer) | Server-side JSON loading | Server reads from disk |
| `i18next-http-backend` | (peer) | Client-side JSON fetching | Browser fetches `/locales/…` |
| `i18next-browser-languagedetector` | (peer) | Client-side language detection via `htmlTag` | Reads `<html lang>` set by server |

**No new dependencies needed.** All i18n primitives are installed and working.

### Translation file layout

```
public/locales/
├── el/
│   └── common.json   (default/fallback, 478 keys)
└── en/
    └── common.json   (478 keys — perfectly symmetric with el)
```

Both files have identical key sets. Do not introduce asymmetry.

## Architecture Patterns (already in code)

### Pattern 1: Route namespace declaration

Every route that uses `t()` SHOULD declare its i18n namespace so remix-i18next knows which JSON files to preload during SSR:

```typescript
// CORRECT
export const handle = { i18n: ["common"] };
```

**Current status:**

| Route | Declares `handle.i18n` | Uses `useTranslation` |
|-------|-----------------------|----------------------|
| `app/routes/qa._index.tsx` | ❌ MISSING | ✅ |
| `app/routes/qa.$questionId.tsx` | ❌ MISSING | ✅ |
| `app/routes/qa.ask.tsx` | ❌ MISSING | ✅ |
| `app/routes/videos._index.tsx` | ✅ | ✅ |
| `app/routes/exercises._index.tsx` | ✅ | ✅ |
| `app/routes/exercises.$pdfId.tsx` | ❌ MISSING (no i18n at all) | ❌ |
| `app/routes/admin.qa.tsx` | ✅ | ✅ |
| `app/routes/admin.videos.tsx` | ✅ | ✅ |
| `app/routes/admin.exercises.tsx` | ✅ | ✅ |

Root (`app/root.tsx:63-65`) already declares `i18n: ["common"]`, so these routes render correctly by inheritance. Adding per-route declarations is a best-practice hygiene fix, not a bug-fix.

### Pattern 2: Server-side DB content localization

`app/utils/i18n.server.ts:58-91` defines `getLocalizedContent(item, lang)` / `getLocalizedList(items, lang)`:
- If `lang === 'el'`, returns the item untouched (Greek is the DB canonical).
- If `lang === 'en'`, merges `item.translation.en.{title,description,category,tags}` over the Greek fields.
- Falls back to Greek on any missing translation.

**Call-site coverage:**

| Route/Entity | Calls `getLocalized*`? | Correct? |
|--------------|-----------------------|----------|
| `videos._index.tsx:38` (Video list, public) | ✅ `getLocalizedList` | ✅ |
| `exercises._index.tsx:102` (Exercise list, public) | ✅ `getLocalizedList` | ✅ |
| `exercises.$pdfId.tsx:23` (Exercise PDF viewer) | ❌ Returns raw | **GAP** — title displayed in EN mode is Greek |
| `qa._index.tsx`, `qa.$questionId.tsx` | N/A — Q&A is user-generated | ✅ (out of scope by design) |
| `books._index.tsx`, `books.$bookId.tsx` | Not audited (v1.0 scope) | Pre-existing |
| Admin routes | Pass raw DB content with `translation` blob intact — each admin *Card edits via `translation.{el,en}`. Admin UI is EL-only by convention | Acceptable |

### Pattern 3: Client-side translation via `t()`

All UI strings MUST resolve through `t('namespace.key')`. Inline English/Greek literals are bugs. Two acceptable exceptions identified in the current codebase:
- **User-generated content** (Q&A question titles/bodies, tag names) — shown as-entered.
- **Fallback parameter to `t()`** — e.g., `t("videos.pageTitle", "Διδακτικά Βίντεο")`. The fallback SHOULD match the default language (EL). The current `videos._index.tsx` usage is consistent. The `qa.$questionId.tsx` usage is inconsistent (EN fallbacks like `"Delete Question"` are written in Greek-default mode).

### Pattern 4: Language switch flow

`components/languageIndicator/languageIndicator.tsx:36-45`:
1. Calls `i18n.changeLanguage(code)` (client-side i18next re-renders with new keys).
2. POSTs to `/api/language` (action sets `i18nCookie`).

**Remix loader revalidation:** Remix revalidates ALL route loaders on `action` response by default. This means `videos._index` loader re-runs after the language POST → `getLocalizedList` re-runs with new `locale` → localized DB content re-renders with fresh strings. Verified by inspection: `videos._index.tsx:34-43` reads `i18next.getLocale(request)` in its loader, so revalidation drives the update.

**Client-side**: `i18n.changeLanguage()` triggers all `useTranslation()` consumers to re-render with the new translation dictionary. This is a React subscription, not a full page reload.

**Stale state risks** (verified via code read, low impact):
- `SearchInput` (`components/search/searchInput.tsx:88`) re-derives `isEn` from `i18n.language` and rebuilds `categoryOptions`/`levelOptions`/`typeOptions` via `useMemo([isEn])`. ✅ Re-renders correctly.
- `videos._index` derives `categoryOptions` via `useMemo([isEnglish])`. ✅ Re-renders correctly.
- No stale-state bugs detected.

## User Constraints (from REQUIREMENTS.md / ROADMAP / STATE.md)

### Locked Decisions (from project docs)

- **Languages:** only `el` (default/fallback) and `en`. Do not add a third.
- **Translation file:** single `common.json` namespace per locale. Do not split namespaces.
- **DB content model:** `translation: { el: {title, description, category, tags}, en: {...} }` JSON column on `Exersice`, `Book`, `Video`, `Training`. Do not change this shape.
- **Out of scope:** translating user-generated Q&A content (question titles, bodies, tags, category labels entered by students). Only UI chrome gets i18n.
- **URL contract** (from Phase 6 / STATE.md): `/exercises` URL values stay Greek-canonical — `?level=Α-Λυκείου`, not `?level=A-High-School`. Dropdown LABELS swap EN/EL; URL values do not.
- **Default categories seed** in Q&A (Algebra, Geometry, …) is English on purpose — it's a seed only fired when no user-created category exists. User-entered categories overwrite this naturally.

### Claude's Discretion

- Exact English/Greek wording for the 13 missing keys — suggestions provided below but the planner/implementer may refine.
- Whether to scope-in legacy cleanup (`components/uploadExTabs/*`, `components/card/card.tsx`, `components/kbar/kbar.tsx`, `components/errorPage/errorPage.tsx`) — these contain Greek hardcoded strings but are either orphaned or ErrorBoundary-only. Recommendation: **leave orphaned files untouched** (uploadExTabs — no longer used in admin), **scope-in `card/card.tsx`** because `exercises._index.tsx` still uses it for localized exercise display, **leave `errorPage.tsx`** (ErrorBoundary is outside route tree — running `t()` there is fragile and the current Greek-only state is acceptable for a 404 page on a Greek-default site), **leave `kbar/kbar.tsx`** (admin kbar panel; admin is Greek-only by convention).
- Whether to fix the `BilingualFields` double-translate bug now or ticket it. Recommendation: **fix now** — it's one small touch per callsite and ExerciseUploadForm is new v1.1 code.
- Whether to translate action-function error responses (`"Only question author can accept answers"` etc.). Recommendation: **YES** — these strings ARE shown to logged-in students via `actionData.error`. Use a scheme where actions return an error-key (`qa.errors.selfVote`) that the client passes through `t()`.

### Deferred Ideas (OUT OF SCOPE)

- AuditLog records (admin-only, English by convention).
- Email templates (none exist for v1.1).
- `/robots.txt`, `/sitemap.xml` (metadata routes, no user text).
- Error-page fallbacks (`errorPage.tsx`) — ErrorBoundary often runs before i18n is initialized.
- Video embed titles/creator names — user-entered metadata shown as-is.
- Translating user-generated Q&A content — explicitly out per REQUIREMENTS.md.
- Legacy admin tabs in `components/uploadExTabs/` — confirmed orphaned, no current callers in the admin routes.

## Audit Findings

### Finding 1 — Missing locale keys (13 total, present in neither EL nor EN)

Full list verified by Python diff of all `t('...')` callsites against both locale JSON files.

| Missing Key | Used At | Suggested EL | Suggested EN |
|-------------|---------|--------------|--------------|
| `qa.edit` | `qa.$questionId.tsx:509, :640` | Επεξεργασία | Edit |
| `qa.save` | `qa.$questionId.tsx:453, :607` | Αποθήκευση | Save |
| `qa.edited` | `qa.$questionId.tsx:497, :629` | επεξεργάστηκε | edited |
| `qa.tagsPlaceholder` | `qa.$questionId.tsx:441` | Ετικέτες χωρισμένες με κόμμα | Comma-separated tags |
| `qa.deleteQuestionTitle` | `qa.$questionId.tsx:716` | Διαγραφή Ερώτησης | Delete Question |
| `qa.deleteQuestionMessage` | `qa.$questionId.tsx:717` | Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ερώτηση; Η ενέργεια αυτή δεν μπορεί να αναιρεθεί. | Are you sure you want to delete this question? This action cannot be undone. |
| `qa.deleteAnswerTitle` | `qa.$questionId.tsx:734` | Διαγραφή Απάντησης | Delete Answer |
| `qa.deleteAnswerMessage` | `qa.$questionId.tsx:735` | Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την απάντηση; Η ενέργεια αυτή δεν μπορεί να αναιρεθεί. | Are you sure you want to delete this answer? This action cannot be undone. |
| `admin.qa.actions` | `admin.qa.tsx:126` | Ενέργειες | Actions |
| `admin.videos.createButton` | `components/admin/VideoUploadForm.tsx:144` | Δημιουργία Μαθήματος | Create Tutorial |
| `admin.videos.creating` | `components/admin/VideoUploadForm.tsx:143` | Δημιουργία... | Creating... |
| `admin.training.replaceContentImage` | `components/admin/TrainingCard.tsx:140` | Αντικατάσταση Εικόνας Περιεχομένου | Replace Content Image |
| `admin.training.replaceSolutionImage` | `components/admin/TrainingCard.tsx:156` | Αντικατάσταση Εικόνας Λύσης | Replace Solution Image |

**Note on `admin.videos.createButton`/`creating`**: the locale files already contain `admin.videos.uploadButton` + `admin.videos.uploading` (present in both EL and EN). The VideoUploadForm component was coded with a different convention. Two fixes possible:

- **Option A (smaller diff):** Add the two missing keys to both locale files.
- **Option B (cleaner):** Change the component to use the existing `admin.videos.uploadButton` / `admin.videos.uploading` keys. Matches the pattern used by every other admin form (exercises, training, books all use `uploadButton`/`uploading`). **Recommended.**

### Finding 2 — Missing `handle.i18n` declarations

Three Q&A routes use `useTranslation` without a local namespace declaration. Root-level `handle` inherits, so this is hygiene — not a render bug. Add to each:

```typescript
export const handle = { i18n: ["common"] };
```

- `app/routes/qa._index.tsx` (top of file, after imports)
- `app/routes/qa.$questionId.tsx`
- `app/routes/qa.ask.tsx`

### Finding 3 — Hardcoded strings bypassing `t()`

#### 3a. `exercises.$pdfId.tsx` (public PDF viewer)

- Line 104: `Download` hardcoded button label (inside `<Download>` plugin slot).
- Line 136: `PDF not available` hardcoded error message.
- Line 121: `{data.title}` rendered raw — NOT passed through `getLocalizedContent`, so EN users see Greek titles on the PDF detail page.
- No `useTranslation()` import, no `handle.i18n` export.

**Work to do:** Add `useTranslation`, add `handle`, localize the PDF title in the loader using `i18next.getLocale(request)` + `getLocalizedContent(pdf, locale)`, add two locale keys (`exercises.download`, `exercises.pdfNotAvailable`).

#### 3b. `qa.$questionId.tsx` — `formatRelativeTime` hardcoded English

Lines 332-345:

```typescript
if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
if (diffHr > 0)  return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
return 'just now';
```

Used only in the edited-indicator (`({t('qa.edited', 'edited')} ${formatRelativeTime(…)})`). Either:
- Replace with `Intl.RelativeTimeFormat(locale, { numeric: 'auto' })` — no new locale keys needed, locale-aware pluralization built-in. **Recommended** — native browser API, zero new keys.
- OR introduce `qa.time.justNow`, `qa.time.minutesAgo`, `qa.time.hoursAgo`, `qa.time.daysAgo` with `{{count}}` interpolation + i18next pluralization.

#### 3c. Q&A action error messages (server-returned)

`qa.$questionId.tsx` returns these `error` strings from the action that are then displayed via `actionData.error`:
- Line 100: `'Question ID required'`
- Line 109: `'You must be logged in'`
- Line 123: `'Answer must be at least 10 characters'`
- Line 143, 160: `'Cannot vote on own content'`
- Line 174: `'Only question author can accept answers'`
- Line 186: `'Only question author can delete'`
- Line 212: `'Only answer author can delete'`
- Line 236: `'Only question author can edit'`
- Line 248: `'Title must be at least 10 characters'`
- Line 251: `'Body must be at least 10 characters'`
- Line 266: `'Answer must be at least 10 characters'`
- Line 272: `'Only answer author can edit'`
- Line 284: `'An error occurred'`

`qa.ask.tsx` similar list at lines 87-99, 123.

**Pattern:** return an error KEY from the server, not the translated string. Server `json<ActionData>({ error: 'qa.errors.selfVote' })`, then client renders `{t(actionData.error)}`. Add ~12 error keys under `qa.errors.*`.

Alternative (simpler but less clean): run a lookup map at the display site. Either works; recommend the key-return pattern because it's the convention already used for form `fieldErrors` in other code.

#### 3d. Q&A default categories (hardcoded English)

- `qa.ask.tsx:43-50`: `defaultCategories = [{name:'Algebra', count:0}, {name:'Geometry', count:0}, …]`
- `qa.$questionId.tsx:323`: `defaultCategories = ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Number Theory', 'Other']`

These are shown in the category dropdown when no user has created categories yet. Per the "no user-generated Q&A translation" rule, these are technically user-seed, not UI chrome. Two options:
- **Leave as-is** (consistent with the URL/DB contract — once a category exists in DB, it's user-generated and language-agnostic).
- **Translate via `t('qa.categories.algebra')` etc.** with a mapping. Adds 6 keys but UX cost is the category values inserted on the first question in EN will differ from EL ones.

**Recommendation:** Leave as-is; document in comments that these are user-seed placeholders. This matches the Greek-canonical URL pattern already in effect for exercises.

#### 3e. `components/card/card.tsx` (actively used)

Line 14: `alt="Γρηγόρης Κυρτσιάς"` — OK, it's the teacher's name (proper noun), language-agnostic.
Lines 19-31: renders `item.category`, `item.tags`, `item.title`, `item.description` directly. Loader already localizes these via `getLocalizedList`, so the card renders correctly in both languages. ✅ No fix needed.
Line 36-41: button has an icon-only `<EyeIcon />` — no text. ✅.

**Card itself is OK.** The comment on line 14 about "alt=Γρηγόρης Κυρτσιάς" is acceptable per proper-noun exception.

### Finding 4 — Double-translate bug in admin exercise forms

`components/admin/ExerciseUploadForm.tsx:66-67`:

```typescript
<BilingualFields
  fieldName="title"
  labelKeyEl={t("admin.exercises.titleEl")}    // passes translated STRING
  labelKeyEn={t("admin.exercises.titleEn")}
  ...
/>
```

`BilingualFields.tsx:36`:

```typescript
<label …>{t(labelKeyEl)} {required && "*"}</label>   // t() called on already-translated string
```

i18next returns the raw key when it can't match (default behavior with `returnEmptyString: false`), so passing "Τίτλος (Ελληνικά)" causes `t()` to return "Τίτλος (Ελληνικά)" back. This LOOKS correct in EL but **does not switch when `i18n.language === 'en'`** because the label is baked in at render time of the parent — it's a stale `t()` result.

Same bug in `BulkExerciseUploadForm.tsx:136-137`.

Compare with the correct pattern in `VideoUploadForm.tsx:65-66`:

```typescript
labelKeyEl="admin.videos.titleEl"    // passes KEY, not translated value
labelKeyEn="admin.videos.titleEn"
```

**Fix:** Change ExerciseUploadForm and BulkExerciseUploadForm to pass key strings, not `t(...)` calls. 4 edits total, all trivial string replacements.

### Finding 5 — Orphaned legacy components with Greek hardcoded strings

Grep of all Greek (`[\u0370-\u03FF]`) characters in `components/` found these files with hardcoded Greek that are NOT consumed by any v1.1 admin route:

| File | Used By | Action |
|------|---------|--------|
| `components/uploadExTabs/uploadExercise.tsx` | `app/routes/uploadEx.tsx` only | Orphaned in v1.1; leave alone OR delete if uploadEx.tsx is itself unused |
| `components/uploadExTabs/uploadFile.tsx` | Same | Same |
| `components/uploadExTabs/uploadBook.tsx` | Same | Same |
| `components/uploadExTabs/uploadTutorial.tsx` | Same | Same |
| `components/input/input.tsx` | `components/uploadExTabs/*` | Orphan chain |
| `components/training/trainingList.tsx` | `app/routes/testYourself.*` | Out of v1.1 scope (Phase 3 Q&A / Phase 5 Videos / Phase 6 Exercises are the v1.1 work) |
| `components/kbar/kbar.tsx` | `components/navs/navList.tsx`? (grep-needed) | Check; if admin-only, leave untranslated (admin is EL-only by convention) |
| `components/errorPage/errorPage.tsx` | `app/root.tsx` ErrorBoundary | Leave as-is; ErrorBoundary runs pre-hydration |

**Recommendation:** Skip orphans. If the planner wants to include them for cleanliness, split into a separate plan that can drop them or skip the phase.

### Finding 6 — Language-switch robustness (by feature area)

Tested by code inspection:

| Page | Switching EL↔EN works? | Stale-state risks |
|------|----------------------|-------------------|
| `/qa` (list) | ✅ All t() keys (after Finding 1 fixes) | None — categories/tags come from DB, not affected |
| `/qa/:id` (detail) | ⚠️ After Findings 1 + 3b + 3c fixes | None once missing keys + relative-time are fixed |
| `/qa/ask` | ✅ (default categories stay English per the scope decision) | None |
| `/videos` | ✅ | Category labels re-derive via `useMemo([isEnglish])` ✅ |
| `/exercises` (list) | ✅ | `SearchInput` re-derives option maps via `useMemo([isEn])` ✅ |
| `/exercises/:pdfId` | ❌ Not localized at all — see Finding 3a | N/A |
| `/admin/*` (all) | Greek-only by convention; EN labels exist for completeness | Does not matter — admin is EL-only |

### Finding 7 — Pitfalls from `remix-i18next` + Vite (verified in this repo)

**Pitfall 1: Locale JSON path differs dev vs. prod.**
`app/i18next.server.ts:16-19` handles this:

```typescript
loadPath: process.env.NODE_ENV === "development"
  ? resolve("./public/locales/{{lng}}/{{ns}}.json")
  : resolve("./locales/{{lng}}/{{ns}}.json"),
```

Prod build must copy `public/locales/` to `locales/` at the deploy root. Already working (v1.0 shipped).

**Pitfall 2: Adding a new locale key requires no rebuild — JSON is loaded at runtime from disk.** Dev HMR does NOT reload `common.json` on edit; browser must reload. Plan the implementation to do JSON edits first, verify client picks them up on a single manual reload, then code edits.

**Pitfall 3: `i18n.changeLanguage()` does not revalidate Remix loaders automatically.** The fetcher.submit to `/api/language` does (because Remix revalidates after any action response). If the language indicator is ever refactored to not POST, localized DB content will get stuck until next navigation. Not a current bug; worth a warning comment.

**Pitfall 4: Greek URL params + HTTP encoding.** `/exercises?category=Παράγωγοι` round-trips via URL-percent-encoding. Already working (Phase 6 shipped). Do not change.

**Pitfall 5: `returnEmptyString: false` default behavior.** i18next returns the key string when a translation is missing. This MASKS missing-key bugs — page looks correct in EL (because the key is the EL fallback when using `t('qa.edit', 'Επεξεργασία')`) but in EN, the fallback (or the key) renders. The ONLY reliable way to find missing keys is the Python cross-reference script run during research. Add to phase verification: `node scripts/check-i18n-keys.js` (or equivalent one-off check).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative-time formatting in 2 languages | Custom `formatRelativeTime` with manual string concat | `Intl.RelativeTimeFormat(locale, { numeric: 'auto' })` | Browser API handles EL/EN pluralization natively |
| Number/date in translations | Raw `toString()` + template concat | `t('qa.totalQuestions', { count })` with i18next pluralization (`_one`, `_other` suffixes — already used at `exercises.resultCount_one`) | Already in use; keep using |
| Translation key lookup for UI text | Lookup maps in component files | `t('namespace.key')` + JSON files | Already in use |
| Server-returned error → user-facing string | Hardcoded English on the server | Return error KEY, render `{t(errorKey)}` on the client | One source of truth, both languages; matches the existing `fieldErrors` pattern |

## Common Pitfalls

### Pitfall 1: Missing-key fallback masks bugs

**What goes wrong:** `t('qa.edit', 'Edit')` returns "Edit" in both languages if `qa.edit` is missing from BOTH locale files. In EL mode the user sees English.

**How to avoid:** Never use the 2-arg form of `t()` for production code. Always ensure the key exists in both JSON files. If the planner sees `t('foo', 'bar')`, treat it as a red flag.

### Pitfall 2: Double-`t()` invocation on already-resolved strings

**What goes wrong:** `t(t('foo.bar'))` — inner `t()` returns the Greek string, outer `t()` fails the lookup and returns the Greek string unchanged. Works by accident until the user switches to EN.

**How to avoid:** Never call `t()` on a prop before passing it to another component that also calls `t()`. Pass the KEY, not the translated value. See Finding 4.

### Pitfall 3: Hardcoded English on the server

**What goes wrong:** Action returns `json({ error: 'Cannot vote on own content' })`. EN users see English; EL users ALSO see English.

**How to avoid:** Return an error KEY (`qa.errors.selfVote`); render `{t(actionData.error)}` on the client. See Finding 3c.

### Pitfall 4: Locale-cached derived state in useMemo

**What goes wrong:** `const cats = useMemo(() => buildCategories(), [])` — empty dep array means EN users see EL categories until navigation.

**How to avoid:** Include `i18n.language` (or a derived `isEn` boolean) in the `useMemo` deps when the derived data depends on language. Already correctly done in `SearchInput` and `videos._index`. Code-review new `useMemo` uses for this.

### Pitfall 5: `Intl.DateTimeFormat`/`toLocaleDateString` with wrong locale

**What goes wrong:** `new Date().toLocaleDateString()` (no locale arg) uses the browser default, which may or may not match the current `i18n.language`.

**How to avoid:** Always pass the locale: `toLocaleDateString(i18n.language === 'el' ? 'el-GR' : 'en-US', …)`. Pattern already used in `qa.$questionId.tsx:327` and `qa._index.tsx:100`. Replicate when adding date rendering. For `admin.qa.tsx:171` and `components/admin/ExerciseCard.tsx:257`, the `toLocaleDateString()` is called with no locale — minor bug; admin is EL-only so acceptable, but worth noting.

## Code Examples (from this repo)

### Correct: key-first pattern

```typescript
// components/admin/VideoUploadForm.tsx:65-66
<BilingualFields
  fieldName="title"
  labelKeyEl="admin.videos.titleEl"   // key, not value
  labelKeyEn="admin.videos.titleEn"
  ...
/>
```

### Correct: language-aware useMemo

```typescript
// components/search/searchInput.tsx:87-88, 122-127
const { t, i18n } = useTranslation();
const isEn = i18n.language?.startsWith("en") ?? false;
const categoryOptions = useMemo(
  () => pairOptions(Category, Category_En, isEn),
  [isEn],
);
```

### Correct: loader-driven DB localization

```typescript
// app/routes/videos._index.tsx:34-43
export const loader: LoaderFunction = async ({ request }) => {
  const locale = (await i18next.getLocale(request)) as SupportedLanguage;
  const videos = await getAllVideos();
  const localizedVideos = getLocalizedList(videos, locale);
  return data({ videos: localizedVideos, locale });
};
```

### Recommended new pattern: server-returned error keys

```typescript
// server (action)
return json<ActionData>({ error: 'qa.errors.selfVote' }, { status: 403 });

// client
{actionData?.error && <p className="text-red-600">{t(actionData.error)}</p>}
```

## Recommended Plan Decomposition

Four plans, with explicit dependency order:

### Plan 07-01 — Locale keys (Wave 0, blocking)
**Goal:** Add the 13 missing keys to both `public/locales/el/common.json` and `public/locales/en/common.json`. Add any new error-message keys that Plans 07-02/03/04 will need.
**Files touched:** 2 (`el/common.json`, `en/common.json`). Plus one if we add a `qa.errors.*` group.
**Dependencies:** None. Must merge before the other three plans.
**Parallelizable with:** Nothing (it's the foundation).

### Plan 07-02 — Q&A i18n completion (Wave 1, parallelizable)
**Goal:** Fix all Q&A i18n gaps.
**Files touched:**
- `app/routes/qa._index.tsx` — add `handle.i18n`.
- `app/routes/qa.$questionId.tsx` — add `handle.i18n`, replace `formatRelativeTime` with `Intl.RelativeTimeFormat`, remove inline t() fallback strings (can now rely on keys existing), convert action error strings to error keys.
- `app/routes/qa.ask.tsx` — add `handle.i18n`, convert action error strings to error keys.
- `components/qa/ConfirmModal.tsx` — optional: remove hardcoded `'Delete'`/`'Cancel'` default props (currently fine because callers always pass translated values).
- `components/qa/VoteButtons.tsx` — optional: translate `aria-label="Upvote"/"Downvote"` via `t()`. Low priority (screen-reader-only).
**Depends on:** 07-01.
**Parallel with:** 07-03, 07-04.

### Plan 07-03 — Videos i18n completion (Wave 1, parallelizable)
**Goal:** Fix video-related i18n gaps.
**Files touched:**
- `components/admin/VideoUploadForm.tsx` — replace `t("admin.videos.creating")` / `t("admin.videos.createButton")` with the existing `admin.videos.uploading` / `admin.videos.uploadButton` keys (OR add the two missing keys — prefer the former for consistency with other forms). Assuming 07-01 picked the Option-B path, this becomes a 2-line change.
- `components/admin/TrainingCard.tsx` — now that `admin.training.replaceContentImage` / `replaceSolutionImage` exist in locale files, no code change (the component was already calling them; keys were just missing). Verify after 07-01 merges.
**Depends on:** 07-01.
**Parallel with:** 07-02, 07-04.

### Plan 07-04 — Exercises & admin-exercise i18n completion (Wave 1, parallelizable)
**Goal:** Fix exercise-related i18n gaps including the public PDF viewer.
**Files touched:**
- `app/routes/exercises.$pdfId.tsx` — full i18n retrofit: import `useTranslation` + `i18next.server`, add `handle.i18n`, localize title via `getLocalizedContent` in loader, translate "Download" and "PDF not available".
- `components/admin/ExerciseUploadForm.tsx` — fix double-`t()` bug at lines 66-67 and 77-78 (pass key strings).
- `components/admin/BulkExerciseUploadForm.tsx` — fix double-`t()` bug at lines 136-137.
- `public/locales/{el,en}/common.json` — add `exercises.download`, `exercises.pdfNotAvailable`. (Small; could fold into 07-01 if planner prefers.)
**Depends on:** 07-01.
**Parallel with:** 07-02, 07-03.

**Rationale for the split:** 07-02, 07-03, 07-04 touch disjoint file sets:
- 07-02: `app/routes/qa*.tsx`, `components/qa/*`
- 07-03: `components/admin/VideoUploadForm.tsx`, `components/admin/TrainingCard.tsx`
- 07-04: `app/routes/exercises.$pdfId.tsx`, `components/admin/Exercise*Form.tsx`, `BulkExerciseUploadForm`

Zero file overlap. They can run in parallel once 07-01 merges.

**Verification plan (each):** run `npm run build` + `npm run typecheck`, then manually toggle the language indicator on the affected pages and confirm:
1. All visible text switches.
2. No untranslated key strings (like `qa.edit`) appear as literal page text.
3. Server-returned error messages (voting on own post, etc.) render in the user's language.

## Validation Architecture

> `workflow.nyquist_validation` is NOT set in `.planning/config.json` (defaulted false). Skipping Validation Architecture per the gsd-phase-researcher template.

## Open Questions

1. **Translate Q&A default-categories seed (`['Algebra', 'Geometry', …]`)?**
   - What we know: These are inserted as `category` strings on new Question records only when the DB has no categories. User-entered categories replace them thereafter.
   - What's unclear: Does the product owner want a Greek version of these seeds so the first EL user creating a question sees Greek category names in the dropdown?
   - Recommendation: Leave English. Consistent with "user-generated Q&A content stays as-is". Document as a known product decision.

2. **Fix `BilingualFields` double-`t()` at the component level instead of at callsites?**
   - What we know: `BilingualFields` calls `t()` on its props; ExerciseUploadForm passes pre-translated values.
   - What's unclear: Could we change `BilingualFields` to accept either a key OR a value (detect with a heuristic)?
   - Recommendation: No — fix at the callsites. The component's contract IS "pass a key", and ExerciseUploadForm has the bug. Detection-via-heuristic is fragile.

3. **Scope legacy orphan cleanup (`components/uploadExTabs/*`)?**
   - What we know: Greek hardcoded labels exist; no v1.1 admin route imports them.
   - What's unclear: Are they ACTUALLY orphan or used by `app/routes/uploadEx.tsx` (which may itself be legacy)?
   - Recommendation: Verify via `Grep` before scoping. If truly orphan, defer to a future housekeeping phase — do NOT expand Phase 7 to cover them.

4. **Translate action error messages via i18next now, or ticket and defer?**
   - What we know: The user-visible surface is `qa.$questionId.tsx` and `qa.ask.tsx` `actionData.error` displays. Users hit these on self-vote, no-auth edit attempts, validation failures.
   - What's unclear: How many keys to add? ~12-15.
   - Recommendation: Include in Plan 07-02 scope. It IS user-visible text in a new v1.1 feature, and punting violates the phase goal.

## Sources

### Primary (HIGH confidence)

- `public/locales/{el,en}/common.json` — direct inspection; both files 478 keys; symmetric.
- `app/utils/i18n.server.ts` — implementation of `getLocalizedContent`/`getLocalizedList`.
- `app/i18next.server.ts` — RemixI18Next config.
- `app/entry.client.tsx` — client-side i18next init.
- `app/root.tsx` — root-level `handle.i18n` + `i18n.dir()`.
- `services/cookies/cookies.ts` (referenced; not re-read — already described in CLAUDE.md).
- `app/routes/api.language.tsx` — language-switch cookie-set action.
- `components/languageIndicator/languageIndicator.tsx` — UI for switching.
- Python cross-reference of every `t('key')` callsite vs. locale JSON: executed 2026-04-21, 13 missing keys identified.
- Greek-character grep (`[\u0370-\u03FF]`) over `app/routes/` and `components/`: confirmed hardcoded Greek found only in legacy + `errorPage.tsx` + `card.tsx alt=`.

### Secondary (MEDIUM confidence)

- `remix-i18next` documentation — not separately re-fetched; existing working integration is the ground truth.
- `Intl.RelativeTimeFormat` MDN — standard browser API for localized time-ago formatting; available in all target browsers (Remix 2 supports evergreen only).

### Tertiary (LOW confidence)

- None needed — Phase 7 is an audit phase against an already-working infrastructure. All findings are verifiable by direct code read.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reads existing package config + working code.
- Architecture: HIGH — patterns already implemented and verified by running code (v1.0 shipped).
- Pitfalls: HIGH — enumerated from actual code-read audit, not speculation.
- Missing-key audit: HIGH — Python cross-reference script is deterministic.

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (stable — no library upgrades expected before phase completes)
