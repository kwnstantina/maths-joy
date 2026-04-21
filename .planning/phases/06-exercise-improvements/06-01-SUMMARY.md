---
phase: 06-exercise-improvements
plan: 01
subsystem: database
tags: [prisma, mongodb, pagination, validators, i18n, schema-migration]

# Dependency graph
requires:
  - phase: 02-book-commerce
    provides: Book model's String[] tags pattern — reused on Exersice
  - phase: 05-video-tutorials
    provides: Video category + tags separation pattern; Greek-canonical-storage + localized-display convention
provides:
  - Exersice schema with tags: String[], level: String?, type: String?
  - ExerciseFilters interface + extended getPaginatedExercises(category, level, type, text, lang)
  - validateExerciseFields level/type allowlist validation
  - One-time legacy migration script prisma/migrate-exercise-tags.ts (tags string → {level, type, tags[]})
  - components/shared/Pagination.tsx (canonical) + components/admin/Pagination.tsx (re-export shim)
affects: [06-02-admin-bulk-upload, 06-03-public-pagination-search, 07-i18n]

# Tech tracking
tech-stack:
  added:
    - "prisma $runCommandRaw for BSON-shaped legacy reads with $oid unwrap"
  patterns:
    - "Shared pagination lives in components/shared/ with a re-export shim in components/admin/ to avoid file-level Wave 2 races"
    - "Allowlist validation via Set<string> built from services/models/models Greek-canonical names"
    - "getPaginatedExercises exposes an explicit ExerciseFilters interface so downstream routes are decoupled from its implementation"

key-files:
  created:
    - prisma/migrate-exercise-tags.ts
    - components/shared/Pagination.tsx
  modified:
    - prisma/schema.prisma
    - app/utils/exersices.prisma.ts
    - app/utils/validators.server.ts
    - components/admin/Pagination.tsx
    - public/locales/el/common.json
    - public/locales/en/common.json

key-decisions:
  - "Drop EN-mode JSON-path substring matching for v1.1 — Prisma 5.22 MongoDB connector's JsonNullableFilter only supports equals/not/isSet, NOT path+string_contains. Text search always queries Greek-canonical columns regardless of lang. Documented as follow-up."
  - "Tag text filter uses Prisma `has` (exact-element, case-sensitive) rather than a substring match — intentional v1.1 limitation; future nice-to-have is a duplicate lowercased-tag column."
  - "Pagination relocation uses re-export shim strategy so Wave 2 plans (06-02, 06-03) can migrate imports independently without racing on the admin file."
  - "Live schema push + migration execution deferred to user — writes to shared MongoDB Atlas. Schema edits committed to file; prisma generate succeeds; migration script is ready to run."

patterns-established:
  - "Schema-to-data-layer migrations: edit schema → prisma generate → update data-access module → file-only typecheck gate (allow downstream route errors to be cleared by successor Wave plans)"
  - "Legacy BSON reads via $runCommandRaw: always unwrap doc._id?.$oid ?? doc._id before feeding to the typed client"
  - "Re-export shims for component relocations: canonical in shared/, shim in original path, Wave plans migrate imports at their own pace"

requirements-completed: [EX-02]

# Metrics
duration: 11 min
completed: 2026-04-21
---

# Phase 6 Plan 1: Exercise Schema + Data Layer Reshape Summary

**Migrated Exersice.tags from comma-separated String to String[], split level/type into dedicated columns, extended getPaginatedExercises with category/level/type/text filters (Prisma mode: insensitive on title+description, exact-element match on tags), and relocated Pagination to components/shared/ with a re-export shim — unblocking both Wave 2 plans (admin bulk upload + public pagination/search).**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-21T13:11:30Z
- **Completed:** 2026-04-21T13:23:26Z
- **Tasks:** 3 completed
- **Files modified:** 8 (2 created, 6 modified)

## Accomplishments

- Prisma Exersice schema now has `tags: String[]`, `level: String?`, `type: String?` (schema edited, `prisma generate` succeeds)
- Legacy data migration script `prisma/migrate-exercise-tags.ts` ready: idempotent, `DRY_RUN` gated, documents `_id.$oid` unwrap contract, uses `$runCommandRaw` for reads + typed client for writes
- `ExerciseFilters` interface exported; `getPaginatedExercises(page, limit, {category, level, type, text, lang})` applies filters server-side via Prisma `where` with `mode: "insensitive"` substring on title/description and `has` on tags
- `StreamingExerciseInput` type updated: `tags: string[]` + optional `level`/`type`; `createExerciseFromStream` and `updateExercise` persist the new shape
- `validateExerciseFields` extended with optional `level`/`type` and TAGS/Type allowlist validation (`errors.invalidLevel` / `errors.invalidType`)
- `components/shared/Pagination.tsx` is the canonical implementation; `components/admin/Pagination.tsx` is a 3-line re-export shim so 06-02 and 06-03 can migrate imports in parallel without colliding
- i18n keys `errors.invalidLevel` / `errors.invalidType` added to both el and en locales

## Task Commits

No commits made per user's durable no-auto-commit feedback. Changes are unstaged and left for user review.

Task-level work breakdown (for reviewer):

1. **Task 1 — schema + migration script** — `prisma/schema.prisma`, `prisma/migrate-exercise-tags.ts`
2. **Task 2 — data layer** — `app/utils/exersices.prisma.ts`
3. **Task 3 — validator + i18n + Pagination relocation** — `app/utils/validators.server.ts`, `components/shared/Pagination.tsx`, `components/admin/Pagination.tsx`, `public/locales/el/common.json`, `public/locales/en/common.json`

## Files Created/Modified

- `prisma/schema.prisma` — Exersice model: `tags: String` → `String[]`, added `level String?`, `type String?`
- `prisma/migrate-exercise-tags.ts` (new, 189 lines) — Idempotent migration splitting legacy tags string into {level, type, tags[]} using TAGS/Type allowlists. Uses `$runCommandRaw` to bypass typed-client coercion on legacy String rows. Unwraps `doc._id?.$oid` before typed updates. `DRY_RUN=true` logs first 3 would-be writes without persisting.
- `app/utils/exersices.prisma.ts` — Exported `ExerciseFilters`. Reshaped `getPaginatedExercises` to apply category/level/type/text filters via Prisma `where`. Added `level`/`type` to `StreamingExerciseInput` and the create/update helpers. Back-compat: legacy `createExersice` helper now splits its comma-separated input into the new String[] shape.
- `app/utils/validators.server.ts` — Imports TAGS/Type, builds `LEVEL_NAMES` + `TYPE_NAMES` sets at module scope, extends `validateExerciseFields` with optional level/type validation.
- `components/shared/Pagination.tsx` (new, 100 lines) — Canonical implementation, byte-equivalent to the former admin version aside from the header comment.
- `components/admin/Pagination.tsx` — Reduced to a 3-line re-export shim (`export { default } from "../shared/Pagination"`).
- `public/locales/el/common.json` — Added `errors.invalidLevel` / `errors.invalidType` (Greek).
- `public/locales/en/common.json` — Added `errors.invalidLevel` / `errors.invalidType` (English).

## Decisions Made

- **Dropped EN-mode JSON-path search for v1.1 (Rule 4 → defer).** The plan specified `{ translation: { path: ["en", "title"], string_contains: t } }` for EN-mode text search, but Prisma 5.22 on the MongoDB connector types `JsonNullableFilter` as `{ equals?, not?, isSet? }` — it does NOT accept `path`/`string_contains` (that shape is PostgreSQL-only). Rather than escalate to `$runCommandRaw` with a native regex (broader blast radius, duplicate pagination logic), text search always queries the Greek-canonical columns. Rendered output still localizes via `getLocalizedContent`. Logged as follow-up for a future iteration.
- **Tag text filter is exact-element + case-sensitive.** Prisma's `has` on `String[]` is exact-match; there is no `contains+mode` equivalent for array elements. Documented inline; a lowercased-tag duplicate column is a future nice-to-have.
- **Pagination relocation via re-export shim.** Rather than migrate all 5 admin route imports in this plan, keep `components/admin/Pagination.tsx` as a 3-line shim. Admin routes continue to work; Plan 06-02 migrates `admin.exercises.tsx` in its own scope and Plan 06-03 imports the canonical path in `exercises._index.tsx`.
- **Live DB migration deferred to user.** `prisma:push` is a shared-infrastructure write and was blocked for that reason. Schema file edits, `prisma generate`, and the migration script are all ready. The operator runs `npm run prisma:push` + `npx tsx prisma/migrate-exercise-tags.ts` once when the change is deployed (script is idempotent and safe to re-run).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] EN-mode JSON-path filter not supported by Prisma 5.22 MongoDB connector**
- **Found during:** Task 2 (data layer) — first full typecheck after writing the EN-mode branch
- **Issue:** Plan specified `{ translation: { path: ["en", "title"], string_contains: t } }`, but `tsc` rejected it: `'path' does not exist in type 'JsonNullableFilter<"Exersice">'`. Inspection of the generated client confirmed the MongoDB JSON filter surface is limited to `equals`/`not`/`isSet` in Prisma 5.22. Postgres-only filter shape.
- **Fix:** Removed the EN-mode `where.OR` branch. Text search unconditionally queries the Greek-canonical columns (title + description + tags) regardless of `lang`. Kept the `lang` parameter on `ExerciseFilters` for API stability and future restoration of this behavior. Added an explicit inline comment documenting why.
- **Files modified:** `app/utils/exersices.prisma.ts`
- **Verification:** `npm run typecheck` — zero errors in `app/utils/exersices.prisma.ts`
- **Impact on Wave 2:** Plan 06-03 can still accept a `text` query param and forward it; EN-mode users with a text query hit the Greek columns, which is acceptable since Greek is the canonical storage.

**2. [Rule 1 - Bug] Pre-existing legacy `createExersice` helper would have broken under new schema**
- **Found during:** Task 2
- **Issue:** `createExersice` passed `tags: string` directly to `prisma.exersice.create`; after regenerating the client, that field is typed as `string[] | ExersiceCreatetagsInput`. The existing cast to `Parameters<…>['data']` also lacked `createdAt`/`updatedAt`.
- **Fix:** Inside `createExersice`, split the incoming comma-separated string into a trimmed, non-empty array via `.split(',').map(t => t.trim()).filter((t) => t.length > 0)`, and pass `createdAt`/`updatedAt` explicitly. Helper remains back-compat with its old signature (still takes `UploadExersiceForm` with `tags: string`) — the adaptation is internal.
- **Files modified:** `app/utils/exersices.prisma.ts`
- **Verification:** `npm run typecheck` — previously 3 errors in this helper, now 0. No breaking change for callers.
- **Impact:** Prevents a typecheck regression that would have blocked Wave 2 from starting.

### Out-of-Scope Deferrals (NOT auto-fixed)

- `app/routes/admin.exercises.tsx` — two `tags` type mismatches (line 201 `tags: tags || ""` passed to `createExerciseFromStream`; line 349 `exercise.tags` rendered as `string` prop). **Plan explicitly assigns these to Plan 06-02.** Not touched.
- `app/routes/exercises._index.tsx` — one `tags` type mismatch on the loader return. **Plan explicitly assigns this to Plan 06-03.** Not touched.
- `components/uploadExTabs/uploadBook.tsx` and `components/uploadExTabs/uploadTutorial.tsx` — 12 pre-existing `string | undefined` errors unrelated to Phase 6 scope. Confirmed baseline before edits; not induced by this plan.

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug).
**Impact on plan:** The EN-mode JSON-path drop is a scope reduction (not a scope creep); the plan correctly flagged this area as risky ("if the resulting UX proves too strict, document a followup"). The legacy `createExersice` fix was essential to keep typecheck green inside `app/utils/exersices.prisma.ts`, which was a hard gate for both Wave 2 plans. Neither deviation changes the data-layer contract for Wave 2.

## Issues Encountered

- **`prisma:push` blocked by sandbox (live DB write).** Documented as a user-gated deploy step. Schema file is edited and the client is regenerated locally; running the migration script against the live DB is a deploy-time action.
- **MongoDB Prisma JSON filter surface is narrower than expected.** See Deviation #1.

## User Setup Required

No new external services. Two manual steps are required at deploy time (not during this plan):

1. **Push schema to MongoDB Atlas:** `npm run prisma:push`
2. **Run the one-time legacy migration:**
   - Dry-run first: `DRY_RUN=true npx tsx prisma/migrate-exercise-tags.ts` (logs first 3 would-be writes; no DB writes)
   - Then execute: `npx tsx prisma/migrate-exercise-tags.ts`
   - Re-running is safe (idempotent — `skippedAlreadyArray == total` after the first successful pass)

## Next Phase Readiness

**Ready for 06-02 (admin bulk upload).**
- `createExerciseFromStream` now accepts `tags: string[]`, `level?`, `type?` — bulk upload can feed parsed metadata directly.
- `validateExerciseFields` validates level + type against allowlists.
- `components/shared/Pagination.tsx` is in place — 06-02 just updates one import line in `admin.exercises.tsx`.

**Ready for 06-03 (public search + pagination).**
- `getPaginatedExercises({category, level, type, text})` is the public-page data source.
- `components/shared/Pagination.tsx` already exists for the public route to import.
- Text filter on title + description is case-insensitive via `mode: "insensitive"` on Prisma 5.22.

**Blockers / concerns for Wave 2:**
- The two Wave 2 plans each depend on one deploy-time step (schema push + migration). Neither plan should assume live data has been migrated; admin bulk upload writes the new shape from the start, but the public list will show pre-migration rows with empty tags arrays until the operator runs the migration script.

## Self-Check: PASSED

- All 9 claimed files exist on disk (8 project files + SUMMARY.md)
- `npm run typecheck` shows 0 new errors in files owned by this plan (exersices.prisma.ts, validators.server.ts, migrate-exercise-tags.ts, both Pagination.tsx)
- Remaining tsc errors are either (a) pre-existing in files unrelated to Phase 6 (uploadBook.tsx, uploadTutorial.tsx), or (b) explicitly deferred to Plans 06-02 / 06-03 per plan instructions
- No git commits made, matching user's durable no-auto-commit feedback

---
*Phase: 06-exercise-improvements*
*Completed: 2026-04-21*
