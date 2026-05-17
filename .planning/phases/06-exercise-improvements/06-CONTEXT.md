# Phase 6: Exercise Improvements - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 delivers four outcomes for the existing exercises surface:

1. **EX-01** — Admin can upload multiple exercise PDFs in a single operation (bulk upload).
2. **EX-02** — Exercise data model has improved category/tag organization: consistent values, multi-tag support, clear separation between level / type / category.
3. **EX-03** — Students can search the public `/exercises` page by title, category, or tags.
4. **EX-04** — Public `/exercises` uses server-side pagination instead of loading every row.

Out of scope for Phase 6: the full i18n translation sweep (Phase 7), bulk-editing non-upload fields in the admin, exercise reviews/ratings, user-facing exercise recommendations.

</domain>

<decisions>
## Implementation Decisions

### Category/Tag Structure (EX-02)

- **Primary frustration to fix:** Inconsistent values in the existing `tags` field — legacy rows contain free-text drift that doesn't match the `TAGS`/`Type`/`Category` allowlists in `services/models/models.ts`.
- **Data model change:** Migrate `Exersice.tags` from comma-separated `String` to `String[]`. Aligns with `Book` and `Video` models which already use `String[]`. Enables native Prisma array queries.
- **Field split:** Introduce three explicit fields on `Exersice`:
  - `category: String` — topic (e.g. "Συναρτήσεις") — already exists
  - `level: String` — class (e.g. "Α-Λυκείου") — new, currently lives inside `tags`
  - `type: String` — exercise type (e.g. "Λυμένες ασκήσεις") — new, currently lives inside `tags`
  - `tags: String[]` — free-form extras after the split
  All three enforced against the constants in `services/models/models.ts` at admin-UI level.
- **Legacy data:** Run a one-time auto-migration script that parses every existing `tags` string, maps recognized values into `level`/`type`, and leaves unmappable strings in the new `tags` array. Script runs once during deploy. Unmappable rows stay usable; no rows are destructed.

### Public Search + Pagination (EX-03, EX-04)

- **UI layout:** Keep the current `SearchInput` component's separate filter fields (Level / Type / Category / text input). Do not collapse into a single free-text box.
- **Text input scope:** Extend the existing text input (currently matches `description` only) to match **title + description + tags** server-side. This honors EX-03 ("search by title, category, or tags") without changing the UI.
- **Filter location:** Server-side. Extend `getPaginatedExercises` (already in `app/utils/exersices.prisma.ts`) to accept level / type / category / text filters and apply them via Prisma `where` before paginating.
- **Pagination pattern:** Numbered pages (`1 2 3 …`). Reuse `components/admin/Pagination` as-is — move it to a shared location if it currently lives only under `admin/`.
- **URL state:** All filters, search text, and page number sync to `searchParams`. Students can bookmark and share filtered views. Use the existing `useSearchParams` pattern already established in `exercises._index.tsx`.

### Translations (Phase-6 slice only — full i18n sweep stays in Phase 7)

- **Bulk upload fields:** Continue the existing admin pattern — admin provides Greek fields (required) and English fields (optional) per exercise at upload time. Every new exercise is translation-ready from day one.
- **English-mode fallback:** When lang=en, exercises with no EN translation fall back silently to their Greek content (same as the existing `getLocalizedContent` behavior). Exercises never hide from the English view.
- **Filter labels:** In English mode, filter buttons display English labels via `TAGS_En` / `Type_En` / `Category_En`. URL values and DB storage stay Greek-canonical (the pattern just shipped on `/videos`).
- **Search language:** Text search matches the **current language's** translated fields. EN mode queries `translation.en.title` + `translation.en.description`; EL mode queries the canonical Greek columns. No cross-language fallback in the query — keeps ranking intuitive.

### Claude's Discretion

User explicitly deferred these to Claude:

- **Bulk upload UX (EX-01):** multi-file picker vs drag-drop, shared-metadata vs per-file-metadata form shape, auto-title from filename vs manual title per file. Claude picks at plan time based on the existing `admin.exercises.tsx` form patterns and Remix multipart upload capability.
- **Bulk upload failure handling (EX-01):** rollback-all vs partial-success-with-retry-list vs silent-skip on per-file failure. Claude picks at plan time; partial-success with a retry list is the default inclination given the existing streaming Cloudinary upload already handles per-file failures.
- **Exact allowlist values for level/type** after the field split — stick with the values already in `services/models/models.ts` unless research surfaces a reason to expand.
- **Tag autocomplete in admin** — nice-to-have; include only if it falls out naturally.
- **`getPaginatedExercises` filter signature** — the final type of the `filters` parameter.

</decisions>

<specifics>
## Specific Ideas

- The `/videos` page that just shipped (phase 05-02) is the visual reference for how filter labels and URL-synced category state should behave on the public exercises page — reuse the same pattern.
- `components/admin/Pagination` is the canonical pagination component — use it on the public page, don't invent a second one.
- Keep URL values and DB values Greek-canonical everywhere; only presentation layer switches to English.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`getPaginatedExercises(page, limit, filters)`** (`app/utils/exersices.prisma.ts:98`) — already exists; extend filter signature to accept `level`, `type`, `text`.
- **`components/admin/Pagination`** — numbered-pages pagination component, already in use by admin. Reuse for the public page.
- **`components/admin/ExerciseUploadForm`** and **`ExerciseCard`** — single-upload admin form patterns; extend or clone for bulk.
- **`uploadStreamToCloudinary`** (`app/utils/cloudinary.server.ts`) — streaming upload already used by single-file admin. Works per-file for bulk.
- **`unstable_composeUploadHandlers` / `unstable_parseMultipartFormData`** — the multipart pattern in `admin.exercises.tsx:116-145` handles one file today; extend to loop over multiple file fields.
- **`validateExerciseFields`** (`app/utils/validators.server.ts`) — reuse; extend to validate `level`/`type` against allowlists.
- **`createTranslation(el, en)`** (`app/utils/i18n.server.ts:122`) — builds the translation JSON. Already used in `admin.exercises.tsx`.
- **`getLocalizedContent` / `getLocalizedList`** (`app/utils/i18n.server.ts`) — language-aware field resolution; works out of the box once we add EN-search support.
- **`Category` / `TAGS` / `Type`** (`services/models/models.ts`) — Greek allowlists.
- **`Category_En` / `TAGS_En` / `Type_En`** — English parallel allowlists, paired by id.
- **Existing admin security chain** in `admin.exercises.tsx`: CSRF validate → rate limit (`upload` bucket: 5/hr) → audit log. Bulk upload inherits this chain.
- **`SearchInput`** (`components/search/searchInput.tsx`) — the current separate-fields filter component; keep layout, re-wire to push state to URL and read server-filtered data.

### Established Patterns

- **Remix flat routes + loader/action pairs** — extend the existing `exercises._index.tsx` loader to accept pagination + filter params from `searchParams`.
- **Server-only code suffix `.server.ts` / `.prisma.ts`** — any new data helpers follow this convention.
- **`data()` from `@remix-run/node`** for loader responses — not `json()`.
- **CSRF + rate limit + audit chain** on every admin mutation — bulk upload mutation must include this, same order as single-upload action.
- **i18n JSON-field translations stored on the model** (`translation: Json?`) with `{el, en}` shape — continue this for new fields.
- **URL as source of truth** for filter state (`useSearchParams`) — already used in `exercises._index.tsx`.

### Integration Points

- `app/routes/exercises._index.tsx` — rewire loader to server-side filtering + pagination; keep `SearchInput` UI, swap loader data source.
- `app/routes/admin.exercises.tsx` — add bulk-upload code path alongside the existing single-upload action (new `_action` value).
- `prisma/schema.prisma` — model change: `tags: String` → `String[]`, plus new `level: String?` and `type: String?` fields (optional for backward-compat with migration).
- `prisma/seed.ts` or one-off script under `prisma/` — the legacy tag-migration script.
- `public/locales/{el,en}/common.json` — add any new filter/pagination/bulk-upload strings as we go (Phase 7 will audit completeness).

</code_context>

<deferred>
## Deferred Ideas

- **Full i18n sweep across Q&A / videos / exercises UI** — Phase 7.
- **Tag autocomplete / admin tag-management UI** — nice-to-have, not in EX-01..EX-04. If it falls out naturally during EX-02 work it can stay; otherwise backlog.
- **Embedded PDF preview in the public exercise card** — out of scope; existing download flow remains.
- **Search ranking / relevance scoring** — EX-03 says "see relevant results"; for v1.1 plain substring-match in title + description + tags is sufficient. Full-text ranking → backlog.
- **Single free-text search box (unified)** — user rejected in favor of the existing separate-fields UI. Could revisit in a future UX pass.
- **Admin bulk-edit (edit multiple existing exercises at once)** — out of scope; EX-01 is bulk *upload* only.

</deferred>

---

*Phase: 06-exercise-improvements*
*Context gathered: 2026-04-21*
