---
phase: 06-exercise-improvements
plan: 03
subsystem: public-exercises-search-pagination
tags: [remix-loader, url-search-params, i18n, pagination, search, greek-canonical]

# Dependency graph
requires:
  - phase: 06-exercise-improvements
    plan: 01
    provides: "Extended getPaginatedExercises({category, level, type, text, lang}) signature + components/shared/Pagination canonical path"
  - phase: 05-video-tutorials
    plan: 02
    provides: "Pattern — i18next.getLocale(request) on server + useSearchParams as URL source of truth, position-paired English labels / Greek values"
provides:
  - "Public /exercises route wired to server-side filter + pagination via getPaginatedExercises"
  - "URL contract: ?category / ?level / ?type / ?input / ?page — all values Greek-canonical regardless of UI language"
  - "Backward-compat: legacy ?title → ?level, ?tags → ?type fallback reads in loader and page component"
  - "SearchInput displays English labels in en-mode but emits Greek-canonical values to the URL (position-paired TAGS/Type/Category vs TAGS_En/Type_En/Category_En)"
affects:
  - "Removes client-side in-memory filter / pagination from the public exercises page"
  - "Shipboard: no getAllExcersices call on the public route; data-layer path is now exclusively getPaginatedExercises"

tech-stack:
  added: []
  patterns:
    - "PairedOption helper: build position-indexed options where `name` = display label (EN or EL depending on mode) and `__greek` = canonical URL value — the List callback unwraps `__greek` before pushing to the URL, so display language never contaminates the URL param"
    - "Greek→display-label lookup map in SearchInput to render the currently-selected filter in the user's language while the URL stores the Greek canonical form"
    - "readParam(primary, fallback) helper in the loader treats placeholder '0' values as unset (cleans up the legacy empty-option id=0 case)"
    - "No EN→EL mapping in the loader — URL is the single source of truth, already Greek by construction (presentation layer does all the language dance at selection time)"

key-files:
  created: []
  modified:
    - app/routes/exercises._index.tsx
    - components/search/searchInput.tsx

key-decisions:
  - "URL-canonicalization contract: URL values are ALWAYS Greek — dropdown labels switch to English in en-mode but the `<option>`-equivalent value pushed to URL is the paired Greek string. A shared link produces identical results for Greek-mode and English-mode viewers. Zero EN→EL mapping tables in the loader (the old CAT_EN2EL / LEVEL_EN2EL / TYPE_EN2EL helpers and the normalize/matches/includes in-memory filtering are gone)."
  - "KEY_MAP translates the legacy List-callback `title` field (field-type key, NOT a human title) to the new URL param names: `title` → `level`, `tags` → `type`, `category` / `input` / `level` / `type` → identity. Justification: avoids modifying services/models/models.ts (each entry's `title` is the legacy field-type prop) and avoids touching the shared <List> component."
  - "Card component is NOT modified. Tags (now String[]) are joined at the call site (`tags.join(', ')`); the level badge (previously `item.title`) now pulls from `item.level ?? item.title` so legacy pre-migration rows still render the old badge content. Card refactor is deferred — out of scope."
  - "SearchInput's explicit search button (magnifier) is retained but its handler (`handleCategorySearch`) is a no-op — every keystroke on the text input already syncs to URL. Kept for UI muscle-memory; optimization to submit-on-blur can be a follow-up if the noisy-URL UX is reported."
  - "Loader treats placeholder `0` values from old SearchInput selects as unset (`readParam` helper). Prevents stale URLs from the old form submitting `?tags=0` as a filter."

patterns-established:
  - "Public listing page pattern: (1) server loader reads searchParams + locale via `i18next.getLocale(request)`, (2) filters pass through to paginated data-layer helper RAW (no translation in the loader), (3) page derives filters from `useSearchParams` each render, (4) setFiltersHandler is a single adapter that routes any field change into the URL and resets `?page`."
  - "Paired-option filter component pattern: `pairOptions(elModel, enModel, isEn)` returns `{ name: displayLabel, __greek: canonicalValue, title: fieldTypeKey }` — the presentation layer can swap language without the URL contract changing."

requirements-completed: [EX-03, EX-04]

# Metrics
duration: 74m
completed: 2026-04-21
---

# Phase 6 Plan 3: Public /exercises Server-Side Search + Pagination Summary

**Rewired the public `/exercises` loader and SearchInput to use server-side filtering + 12-per-page pagination via `getPaginatedExercises`, with URL searchParams as the single source of truth (Greek-canonical values only) and English dropdown labels pairing by id to their Greek canonical options — so a link shared between Greek and English users resolves to the exact same filtered result set, and the old in-memory filter + EN→EL mapping layer is gone.**

## Performance

- **Duration:** 74m (extended by heavy context-loading and the paired-option / List-component audit; actual edit time ~15m)
- **Started:** 2026-04-21T13:35:03Z
- **Completed:** 2026-04-21T14:49:30Z
- **Tasks:** 2 auto tasks executed + 1 checkpoint auto-approved per auto-mode directive
- **Files modified:** 2 (0 created, 2 rewritten end-to-end)

## Accomplishments

- `/exercises` loader now reads `?page`, `?category`, `?level`, `?type`, `?input` from URL (backward-compat: `?title` → level, `?tags` → type), passes RAW values through to `getPaginatedExercises(page, 12, { category, level, type, text, lang })` with ZERO EN→EL mapping in the loader.
- Loader locale resolution uses `await i18next.getLocale(request)` (the pattern from `videos._index.tsx`), eliminating the old `?lang=en` searchparam dependency.
- Page component sources filter state from `useSearchParams` every render; `setFiltersHandler` is a single adapter that mapss legacy field-type keys (`title`/`tags`) to URL param names (`level`/`type`) via `KEY_MAP`, deletes `?page` on any filter change, and calls `setSearchParams`.
- Empty state preserved with its existing i18n keys; empty-state "Clear Filters" button calls `setSearchParams({})`.
- `SearchInput` imports `Category_En`, `TAGS_En`, `Type_En` alongside the Greek models; builds position-paired options where `name` is the display label (English in en-mode, Greek in el-mode) and `__greek` carries the canonical URL value. `onSelect` unwraps `__greek` before calling `setFiltersHandler`, guaranteeing the URL NEVER holds an English label.
- `labelByGreek` lookup renders the currently-selected filter in the user's language inside the List button while the URL still stores the Greek canonical form.
- Pagination imported from `components/shared/Pagination` (canonical path from 06-01); admin page's pagination is untouched.
- Card component is NOT modified (out of scope); tags array is joined at the call site, and level badge uses `item.level ?? item.title` fallback so pre-migration rows still display the old badge content.
- Pre-announced Wave-1 tags-type-mismatch error on `app/routes/exercises._index.tsx:148` (from 06-01-SUMMARY deferrals) is CLEARED — the new loader returns the correct shape.
- Production `npm run build` succeeds; `npm run lint` reports zero errors/warnings on both plan-owned files (after auto-fixing 2 import-order warnings); `npm run typecheck` shows zero errors on plan-owned files.
- Both locale files (`el`, `en`) verified to already contain all required keys (`exercises.resultCount`, `exercises.noResults`, `exercises.noResultsDescription`, `exercises.clearFilters`, `category`, `level`, `typeOfExercise`, `admin.pagination.*`). ZERO writes to locale files, preserving Wave-2 parallel-safety with 06-02.

## Task Commits

No commits made per user's durable no-auto-commit feedback. Changes are unstaged and left for user review.

Task-level work breakdown (for reviewer):

1. **Task 1 — Rewire `/exercises` loader + page component (Greek-canonical URL contract, getPaginatedExercises, shared Pagination)** — `app/routes/exercises._index.tsx` (completely rewritten, 237 lines)
2. **Task 2 — Rewire SearchInput (English labels paired to Greek values)** — `components/search/searchInput.tsx` (completely rewritten, 210 lines)
3. **Task 3 — Human verification checkpoint** — AUTO-APPROVED per execute-phase auto-mode directive

## Final KEY_MAP (legacy List callback `title` → URL param)

```typescript
/**
 * KEY_MAP: legacy `title` field from List callback → new URL parameter name.
 *
 * The `title` keys ("title", "tags", "category", "input") correspond to the
 * legacy `title` string prop on each model entry in
 * `services/models/models.ts`. Despite the misleading name, that prop is
 * actually the FIELD TYPE, not a human title.
 *
 * - "title" (legacy field-type for level) → URL param "level"
 * - "tags"  (legacy field-type for type)  → URL param "type"
 * - "category" → "category" (unchanged)
 * - "input"    → "input"    (unchanged)
 * - "level", "type" → themselves (future-proof passthrough)
 */
const KEY_MAP: Record<string, string> = {
  category: "category",
  title: "level",
  level: "level",
  tags: "type",
  type: "type",
  input: "input",
};
```

## SearchInput paired-option shape

```typescript
/**
 * Option shape fed to <List>:
 *   - `name`: display label (English in en-mode, Greek in el-mode).
 *   - `__greek`: Greek-canonical value — what we push to the URL.
 *   - `title`: legacy field-type key ("category" / "title" / "tags").
 */
function pairOptions(elModel, enModel, isEn): PairedOption[] {
  const elEntries = Object.values(elModel.byId);
  const enEntries = Object.values(enModel.byId);
  return elEntries.map((elEntry, idx) => ({
    id: elEntry.id,
    name: isEn ? enEntries[idx]?.name ?? elEntry.name : elEntry.name,
    __greek: elEntry.name,          // always Greek — goes to URL
    title: elEntry.title,            // "title" / "tags" / "category"
    unavailable: elEntry.unavailable,
  }));
}

// onSelect unwraps __greek so the URL value is never an English label.
const onSelect = (opt) => {
  setFiltersHandler({ title: opt.title, name: opt.__greek });
};
```

## Confirmations

- **Loader performs NO EN→EL mapping:** `grep -nE "CAT_EN2EL|LEVEL_EN2EL|TYPE_EN2EL|buildEnToEl" app/routes/exercises._index.tsx` returns no matches. Loader passes raw URL params through to `getPaginatedExercises`.
- **No `getAllExcersices` call on the public route:** `grep -n "getAllExcersices" app/routes/exercises._index.tsx` returns no matches.
- **Pagination imported from `components/shared/Pagination`:** `grep -n "components/shared/Pagination" app/routes/exercises._index.tsx` returns the canonical import line.
- **English models imported in SearchInput:** `grep -nE "Category_En|TAGS_En|Type_En" components/search/searchInput.tsx` returns 4 matches (import + 3 pairOptions calls).
- **Backward-compat for legacy `?title` / `?tags` URL params:** shipped — `readParam("level", "title")` and `readParam("type", "tags")` in the loader, and the page component's `filters` derivation also falls back to the legacy keys (`searchParams.get("level") || searchParams.get("title")`, etc.).
- **Filter change resets page to 1:** `next.delete("page")` in `setFiltersHandler` (line 150 of `exercises._index.tsx`).

## Files Created/Modified

- `app/routes/exercises._index.tsx` (237 lines, previously 273 lines) — Entire loader + page component rewritten. Loader is now a ~50-line pass-through (URL → filters → `getPaginatedExercises` → `getLocalizedList`); page is a ~120-line render with URL-derived filters, empty-state, and shared Pagination. All legacy helpers removed: `buildEnToElMap`, `categoryEnToEl`, `levelEnToEl`, `typeEnToEl`, `mapToEnglish`, `normalize`, `matches`, `includes`, `applyFilters` — total ~90 lines of dead code excised.
- `components/search/searchInput.tsx` (210 lines, previously 95 lines) — Rewritten with strict TypeScript props (was `any`-typed), paired-option helper, Greek→display-label memo, `onSelect` unwrapper. Imports `Category_En / TAGS_En / Type_En` alongside the Greek models. No change to UI structure (same three Lists + text input + magnifier button + clear-filters row).

## Decisions Made

- **No EN→EL translation in the loader.** URL is the single source of truth and carries Greek canonical values by construction (enforced by SearchInput's `onSelect`). This matches the CONTEXT.md hard-lock: "Keep URL values and DB values Greek-canonical everywhere; only presentation layer switches to English." The old `CAT_EN2EL / LEVEL_EN2EL / TYPE_EN2EL` maps and the `normalize + matches + includes` in-memory filter pipeline are all removed.
- **KEY_MAP preserves the legacy List callback shape.** `services/models/models.ts` encodes each entry's field-type in a `title` string property (unfortunate name — it's "category" / "title" (meaning level) / "tags" (meaning type)). Rather than modify `models.ts` or the shared `<List>` component (both higher-blast-radius), the KEY_MAP in the page component translates the legacy `title` key to the new URL param name at the page layer.
- **Card stays untouched.** Card renders `item.tags` as a single badge and `item.title` as another; I join the tags array with `", "` at the call site and use `item.level ?? item.title` for the second badge so pre-migration rows still render the old content. A proper Card refactor (separate level + type + tags badges, localized) is a follow-up.
- **Locale files NOT touched.** All required keys verified present in both `el` and `en` via greps. Writing locale files in Wave 2 is owned exclusively by 06-02; 06-03 only reads them.
- **Auto-mode checkpoint approved.** Task 3 is a `checkpoint:human-verify` that requires browser testing. Per the execute-phase auto-approve directive, I auto-approved after all automated gates (typecheck, build, lint, locale-key greps, done-criteria) passed with no runtime errors. The plan's 15-step browser verification is deferred to the user's own validation pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `<List>` component displays `category.name`, not the PairedOption's `value` — had to design the option shape so `name` = display label and Greek lives in a separate `__greek` field**

- **Found during:** Task 2 (audit step of the plan: "Audit the List implementation to confirm")
- **Issue:** The plan's initial sketch (`{ value: greekCanonical, label: englishOrGreek }`) assumed I could express "value" and "label" separately, but the shared `<List>` component (`components/lists/lists.tsx`) only renders `{category?.name}` and passes the whole selected object back via `onCallbackFunction`. If `name` holds the Greek value, English users see Greek labels (wrong UX). If `name` holds the English label, the URL would receive the English string (forbidden by CONTEXT.md).
- **Fix:** Designed `PairedOption` with `name` = display label (EN in en-mode, EL in el-mode — what List renders) + `__greek` = canonical URL value (what we push). Added an `onSelect` unwrapper in SearchInput that calls `setFiltersHandler({ title, name: opt.__greek })` so the URL always receives Greek. Also added a `labelByGreek` lookup so the List button displays the currently-selected filter in the user's language (otherwise en-mode users would see "Άλγεβρα" in the button after picking "Algebra").
- **Files modified:** `components/search/searchInput.tsx` (intentional — this is the plan-scoped file)
- **Verification:** `grep -nE "Category_En|TAGS_En|Type_En" components/search/searchInput.tsx` returns 4 matches; `onSelect` emits `opt.__greek`; `pairOptions` uses `elEntry.name` for `__greek` unconditionally.
- **Impact on plan:** Clarifies Task 2's "audit the List implementation to confirm" note; final shape satisfies the must_haves "`value` attribute of each `<option>` and the parameter pushed to the URL are the Greek canonical strings".

**2. [Rule 2 - Critical functionality] `<List>` value-prop display vs URL source of truth mismatch in en-mode**

- **Found during:** Task 2 implementation
- **Issue:** `<List value={...}>` renders the prop literally as the button text. If we pass `filters.category` (Greek) in en-mode, the user sees a Greek label in the button while the dropdown rows show English labels — visually inconsistent, breaks the illusion of an English UI.
- **Fix:** Introduced `labelByGreek` memo (Greek→display-label map) and pass `value={selectedCategoryLabel}` etc. This is DISPLAY-ONLY derivation — the URL and `onSelect` output stay Greek-canonical.
- **Files modified:** `components/search/searchInput.tsx`
- **Verification:** `selectedCategoryLabel = labelByGreek.category[selectedCategoryGreek]` — pure derivation from the paired options. No URL mutation.

**3. [Rule 2 - Critical functionality] `readParam` helper treats legacy placeholder `0` as unset**

- **Found during:** Task 1 implementation
- **Issue:** The old `<SearchInput>` + `<List>` pair initializes each select to `Object.values(...byId)[0].name`, which is the placeholder entry whose `name` is the empty string `""`. BUT the legacy URL state pattern could also produce literal `0` strings if the select's `id` was ever coerced to value. Paranoid defensive read protects against stale bookmarks.
- **Fix:** `readParam` helper trims and drops `""` and `"0"` before passing as a filter. Prevents accidental `?category=0` or `?level=0` from reaching Prisma (which would match nothing).
- **Files modified:** `app/routes/exercises._index.tsx`
- **Verification:** Inline unit-test during execution: `readParam("level", "title")` on a URL with `?level=0&title=Α-Λυκείου` returns `"Α-Λυκείου"` (falls back to legacy key because primary is `"0"` which is treated as unset). Behavior acceptable because the caller still checks `|| undefined` before passing to `getPaginatedExercises`.

**4. [Rule 3 - Blocking] Lint import-order warnings in both files**

- **Found during:** Automated lint gate after writing both files
- **Issue:** ESLint's `import/order` rule flagged: (a) in `exercises._index.tsx`, `react-i18next` should come before `components/*` imports, and (b) in `searchInput.tsx`, `components/lists/lists` should come after `react-i18next`. Warnings only, but zero-warning lint is the habit.
- **Fix:** Ran `npx eslint --fix`. ESLint applied the import-order correction to both files. Re-run confirms zero errors and zero warnings.
- **Files modified:** Same two files.
- **Verification:** `npx eslint app/routes/exercises._index.tsx components/search/searchInput.tsx` → clean.

### Out-of-Scope Deferrals (NOT auto-fixed)

- `app/routes/admin.exercises.tsx` — 2 `tags` type mismatches (lines 201, 349). Explicitly assigned to **Plan 06-02**.
- `components/admin/ExerciseUploadForm.tsx` — 1 "Cannot find name 'CategorySelect'" error. Explicitly assigned to **Plan 06-02**.
- `components/uploadExTabs/uploadBook.tsx` and `components/uploadExTabs/uploadTutorial.tsx` — 12 pre-existing `string | undefined` errors, baseline from prior phases. Out of Phase 6 scope.
- **Card component tags rendering.** `components/card/card.tsx` renders `item.tags` as a single badge string; we join the array at the call site in `exercises._index.tsx` so Card itself stays unchanged. A proper Card refactor (separate level + type + tags badges, localized, click-to-filter) is a future nice-to-have and is not within 06-03 scope.

---

**Total deviations:** 4 auto-fixed (1 blocking, 2 critical-functionality, 1 blocking-lint).
**Impact on plan:** None of the deviations change the plan's contract. Deviation #1 + #2 are clarifications to the Task 2 "audit the List" step; Deviation #3 hardens the URL reader; Deviation #4 is a cosmetic auto-fix. The URL-canonicalization contract (CONTEXT.md hard-lock) is satisfied.

## Issues Encountered

- **None blocking.** All 4 deviations above were resolved inline during the respective task.

## User Setup Required

**No new setup.** Running the existing dev / build / typecheck / lint commands is sufficient to exercise the changes. The deploy-time `prisma:push` + migration script (flagged in 06-01-SUMMARY) remains the only operator step — unchanged by this plan.

## Browser Verification (deferred to user)

The plan's Task 3 checkpoint lists 15 browser-verifiable behaviors. Per the execute-phase auto-mode directive, I auto-approved after all automated gates passed. When the user has time, the full verification sequence lives in `.planning/phases/06-exercise-improvements/06-03-PLAN.md` under `<how-to-verify>`. Highlights to spot-check:

1. `/exercises` shows first 12 rows; Pagination renders "1 2 … N".
2. Pick a category / level / type → URL acquires the Greek canonical value (URL-encoded), results shrink, `?page` is removed.
3. Toggle language to English → dropdown labels are English; picking "Algebra" produces `?category=Άλγεβρα` (NOT `?category=Algebra`).
4. Copy EN-mode URL to a private window in Greek mode → same filtered result set appears (proves Critical URL-canonicalization).
5. Paste a legacy `/exercises?title=Α-Λυκείου&tags=Λυμένες%20ασκήσεις` URL → loader applies them as level + type filters (backward-compat).
6. Apply filters matching nothing → empty-state + "Clear Filters" button appears; clicking it navigates to `/exercises` with no params.
7. Admin `/admin/exercises` still paginates correctly (regression — admin imports via the Pagination re-export shim, which remains intact).

## Next Phase Readiness

**Phase 6 is one step from complete.** With 06-02 (admin bulk upload) also in-flight as Wave 2, Phase 6 finishes as soon as 06-02 lands and the user reviews. Remaining roadmap items:

- **06-02** — admin bulk upload (parallel to this plan — no touched-file conflict)
- **Phase 7** — i18n completion sweep (all new v1.1 features)

**Blockers / concerns for downstream work:**
- None introduced by 06-03.
- The 06-01 user-gated deploy step (`npm run prisma:push` + `npx tsx prisma/migrate-exercise-tags.ts`) still pending before Wave 2 code reaches production.

## Self-Check: PASSED

- `app/routes/exercises._index.tsx` exists on disk (237 lines): FOUND
- `components/search/searchInput.tsx` exists on disk (210 lines): FOUND
- `.planning/phases/06-exercise-improvements/06-03-SUMMARY.md` exists on disk (this file): FOUND
- `npm run typecheck` — zero errors on plan-owned files (`exercises._index.tsx`, `searchInput.tsx`). Remaining project errors all either (a) owned by 06-02 / (b) pre-existing unrelated to Phase 6.
- `npm run build` — succeeds, SSR + client bundles produced.
- `npx eslint` on plan-owned files — zero errors, zero warnings (after auto-fix).
- Locale-key grep: all required keys (`exercises.resultCount`, `exercises.noResults`, `exercises.clearFilters`, `exercises.noResultsDescription`, `category`, `level`, `typeOfExercise`, `admin.pagination.*`) exist in BOTH `el` and `en` locale files. ZERO writes to locale files.
- Grep contract: `getPaginatedExercises` present, `getAllExcersices` absent, `components/shared/Pagination` import present, `CAT_EN2EL|LEVEL_EN2EL|TYPE_EN2EL|buildEnToEl` all absent — all gates green.
- No git commits made, matching user's durable no-auto-commit feedback.

---
*Phase: 06-exercise-improvements*
*Completed: 2026-04-21*
