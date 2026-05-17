# Phase 4: Q&A Discovery - Research

**Researched:** 2026-03-17
**Domain:** Search and filtering for MongoDB/Prisma Q&A data
**Confidence:** HIGH

## Summary

This phase has an unusually small implementation gap. The existing codebase **already implements** the core search and filter functionality end-to-end. The `qa.server.ts` data layer supports text search (case-insensitive `contains` on title and body), category filtering, and tag filtering. The `qa._index.tsx` route already reads `search`, `category`, and `tag` URL params, passes them to the loader, and renders a sidebar with search input, category buttons, and tag buttons.

The remaining work is primarily **UX polish and edge-case handling**: active filter indicators that are visually clear, a way to clear all filters at once, "no results" messaging that distinguishes "no questions exist" from "no questions match your filters", and potentially an "isResolved" status filter (the backend already supports it but the UI does not expose it).

**Primary recommendation:** Focus on UX improvements to the existing search/filter infrastructure rather than building new search architecture. No new libraries needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QA-05 | Users can search and filter questions by category, tags, or text | Backend `getQuestions()` already supports all three filter types. Frontend `qa._index.tsx` already wires search/category/tag params. Work needed: UX polish, active filter visibility, clear-filters action, no-results differentiation, optional resolved-status filter. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^5.22.0 | MongoDB queries with `contains`/`has` filters | Already in use, handles case-insensitive search |
| Remix | ^2.15.2 | URL-based search params for filter state | Already in use, `useSearchParams` drives all filtering |
| React | ^18.3.1 | UI components | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | (configured) | Styling filter UI, active states | Already in use for all Q&A components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma `contains` | MongoDB Atlas Search (full-text) | Atlas Search is better for large datasets with relevance ranking, but overkill for this scale. `contains` is already working and sufficient for a Q&A system with hundreds/low-thousands of questions. |
| URL search params | Client-side state (useState) | URL params are better because they enable shareable/bookmarkable filtered views and work with SSR. Already implemented this way. |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Current Implementation (Already Built)

**Backend** (`app/utils/qa.server.ts`):
```
getQuestions(filters, page, limit, sortBy)
  - filters.category → where.category = exact match
  - filters.tag → where.tags = { has: tag }
  - filters.search → where.OR = [title contains, body contains] (insensitive)
  - filters.isResolved → where.isResolved (supported but not exposed in UI)
  - Combined: all filters AND together via Prisma where clause
```

**Frontend** (`app/routes/qa._index.tsx`):
```
URL params: ?search=...&category=...&tag=...&sort=...&page=...
  - handleSearch() → sets/clears search param
  - handleCategoryFilter() → toggles category param
  - handleTagFilter() → toggles tag param
  - Loader reads all params → calls getQuestions() → returns filtered results
```

**Sidebar components** (already rendered):
```
- Search input with submit button
- Category list with counts and toggle highlighting
- Popular tags with toggle highlighting
- Pagination preserves filter params
```

### Pattern 1: URL-Driven Filter State
**What:** All filter state lives in URL search params, not React state
**When to use:** Always for server-side filtered lists in Remix
**Why it works:** Shareable URLs, back-button support, SSR-compatible, already implemented

### Pattern 2: Filter Combination via Prisma Where Clause
**What:** Multiple filters compose into a single `where` object with implicit AND
**When to use:** When filters should narrow results (intersect, not union)
**Already implemented:** Yes, in `getQuestions()` — category, tag, and search all AND together

### Anti-Patterns to Avoid
- **Client-side filtering of all data:** Don't fetch all questions and filter in the browser. The server-side approach is already correct.
- **Debounced live search without form submit:** The current form-submit approach is appropriate for this scale. Adding debounce/live-search would add complexity without clear benefit.
- **Multiple tag selection:** The current single-tag filter is simpler and matches the UI. Multi-tag selection adds complexity (AND vs OR semantics) with unclear user value at this scale.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text search engine | Custom indexing/ranking | Prisma `contains` (already working) | At this scale (hundreds of questions), `contains` is adequate. Atlas Search is overkill. |
| Filter state management | Custom state sync library | Remix `useSearchParams` (already working) | URL params are the standard Remix pattern for this |
| Pagination with filters | Custom offset tracking | Existing page param logic (already working) | Already correctly resets page on filter change |

**Key insight:** The existing implementation is architecturally sound. The remaining work is UI/UX refinement, not architectural.

## Common Pitfalls

### Pitfall 1: Search Feels Broken When Combined With Filters
**What goes wrong:** User searches for "quadratic" with category "Geometry" selected, gets 0 results, thinks search is broken
**Why it happens:** AND combination of filters can produce empty results when user expects broader matching
**How to avoid:** Show clear "no results for these filters" messaging with suggestion to broaden (e.g., "Try removing the category filter or clearing your search")
**Warning signs:** Users reporting "search doesn't work"

### Pitfall 2: Active Filters Not Visually Obvious
**What goes wrong:** User doesn't realize a category/tag filter is still active, wonders why they see limited results
**Why it happens:** Filter buttons look similar whether active or not, especially on mobile
**How to avoid:** Add a "current filters" summary bar above the question list showing active filters with clear "x" remove buttons. The current orange highlighting exists but a summary bar makes it unmissable.
**Warning signs:** Questions about "where did all the questions go"

### Pitfall 3: MongoDB `contains` Performance at Scale
**What goes wrong:** Case-insensitive `contains` on unindexed string fields gets slow with thousands of records
**Why it happens:** `contains` with `mode: 'insensitive'` does a regex scan, not an index lookup
**How to avoid:** For current scale (< 1000 questions), this is fine. If performance becomes an issue later, add MongoDB text indexes or migrate to Atlas Search. Not needed now.
**Warning signs:** Loader response times exceeding 500ms for search queries

### Pitfall 4: Page Reset on Filter Change
**What goes wrong:** User is on page 3, applies a filter, stays on page 3 but new filtered results only have 1 page — shows empty
**How to avoid:** Already handled correctly — all filter handlers call `newParams.delete('page')` which resets to page 1
**Warning signs:** Already prevented in current implementation

## Code Examples

### Existing Search Implementation (qa.server.ts lines 40-89)
The `getQuestions()` function already composes filters correctly:
- Category: exact match on `where.category`
- Tag: `where.tags = { has: tag }` (Prisma MongoDB array contains)
- Search: `where.OR` with case-insensitive `contains` on title and body
- All filters AND together automatically via Prisma `where` clause composition

### Existing Frontend Filter Handlers (qa._index.tsx lines 94-128)
- `handleSearch()`: Sets/clears `search` param, resets page
- `handleCategoryFilter()`: Toggles `category` param (click same = clear), resets page
- `handleTagFilter()`: Toggles `tag` param (click same = clear), resets page

### What Needs Adding: Active Filter Summary Bar
```typescript
// Pattern for a filter summary bar above the question list
const hasActiveFilters = currentCategory || currentTag || currentSearch;

// Render a bar showing active filters with clear buttons
// Plus a "Clear all" button that removes all filter params
const clearAllFilters = () => {
  const newParams = new URLSearchParams();
  if (searchParams.get('sort')) newParams.set('sort', searchParams.get('sort')!);
  setSearchParams(newParams);
};
```

### What Needs Adding: Better No-Results State
```typescript
// Differentiate between "no questions exist" and "no matches for filters"
{questions.length === 0 && hasActiveFilters ? (
  // "No questions match your filters" with clear-filters button
) : questions.length === 0 ? (
  // "No questions yet. Be the first to ask!"
) : (
  // Question list
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side filter state | URL search params (Remix standard) | Remix v1+ | Already using current approach |
| MongoDB `$text` operator | Prisma `contains` with `mode: 'insensitive'` | Prisma 4+ | Simpler, no index setup needed at small scale |
| Full-text search (Elasticsearch) | Simple `contains` for small datasets | N/A | Appropriate for current scale |

**Deprecated/outdated:**
- None relevant. The current approach is standard for this scale.

## Open Questions

1. **Should "isResolved" status filter be exposed?**
   - What we know: Backend already supports `isResolved` filter. UI does not expose it.
   - What's unclear: Whether users want to filter by resolved/unresolved status
   - Recommendation: Add as a simple toggle (e.g., "Show only unanswered") — low effort, potentially useful for students looking for questions they can help answer

2. **Should search highlight matching text in results?**
   - What we know: Currently, matching questions are shown but the search terms are not highlighted in the results
   - What's unclear: Whether this is worth the implementation effort
   - Recommendation: Defer. Highlighting adds complexity (HTML injection risks, partial word matches) for modest UX benefit. Revisit if user feedback requests it.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `app/utils/qa.server.ts` — existing `getQuestions()` implementation with all filter types
- Direct codebase inspection of `app/routes/qa._index.tsx` — existing search/filter UI and URL param handling
- Direct codebase inspection of `prisma/schema.prisma` — Question model with category (String), tags (String[])
- Direct codebase inspection of `app/routes/qa.ask.tsx` — categories and tags input patterns

### Secondary (MEDIUM confidence)
- Prisma docs: MongoDB connector supports `contains` with `mode: 'insensitive'` and `has` for array fields (verified via working code in codebase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries needed, everything is already in use
- Architecture: HIGH - implementation is already 90% complete, patterns verified by reading actual code
- Pitfalls: HIGH - identified from direct analysis of existing filter logic

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable — no external dependencies changing)
