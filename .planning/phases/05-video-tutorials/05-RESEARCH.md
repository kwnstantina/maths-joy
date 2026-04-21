# Phase 5: Video Tutorials - Research

**Researched:** 2026-03-17
**Domain:** Admin video CRUD + public browse-by-category listing (YouTube links only)
**Confidence:** HIGH

## Summary

Phase 5 builds on a substantial existing foundation. The admin CRUD (create, update, delete) for videos already works in `app/routes/admin.videos.tsx` with CSRF protection, audit logging, bilingual fields, pagination, and YouTube thumbnail extraction. The data access layer (`app/utils/video.prisma.ts`) and validators (`validateVideoFields`) are already implemented. An older public-facing component (`components/video/videoList.tsx`) exists with iframe embedding but is not wired to any public route.

The primary gaps are: (1) the Video Prisma model lacks a `category` field -- the admin form collects a category but it is never persisted to the database, (2) tags are stored as single-element arrays (confirmed blocker in STATE.md), (3) no public-facing route exists for students to browse/watch videos, and (4) the `createVideo` action silently drops the category form value.

**Primary recommendation:** Add a `category` field to the Video schema, fix tags storage to support multiple values, then build a public `/videos` route with category-based filtering reusing existing patterns from the exercises page.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VID-01 | Admin can upload YouTube video links with title, description, category, tags, creator name | Admin CRUD already exists in `admin.videos.tsx`. Gap: category not persisted (schema lacks field), tags stored as single-element array. Fix schema + fix `createVideo`/`updateVideo` to store category and multi-tags. |
| VID-02 | Students can browse video tutorials by category | No public route exists. Need new `app/routes/videos._index.tsx` with category filter UI. Pattern from exercises page (client-side filtering with `Category` model) can be adapted. YouTube embed/link already proven in `VideoCard` and `videoList.tsx`. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Remix 2 | existing | Route handlers, loaders, actions | Already in use throughout project |
| Prisma | existing | MongoDB ORM, Video model | Already in use, just needs schema update |
| react-i18next | existing | Translation hooks | Already integrated in admin video routes |
| Tailwind CSS | existing | Styling | All existing components use Tailwind |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `services/models/models.ts` | N/A | Category and TAGS constants (Greek/English) | For category filter dropdowns on public page |
| `~/utils/i18n.server.ts` | N/A | `getLocalizedContent`/`getLocalizedList` | For translating video content in public listing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side category filtering | Server-side Prisma `where` clause filtering | Server-side is better for large datasets but client-side is simpler for small video collections and matches existing exercise pattern. For initial launch with few videos, client-side is fine. |
| YouTube iframe embed on listing page | Thumbnail-only with link to YouTube | Thumbnails load faster and avoid iframe overhead. Embed on click/detail page only if needed (VID-03 is deferred to v2). |

**Installation:**
```bash
# No new packages needed -- all dependencies already exist
```

## Architecture Patterns

### Recommended Project Structure
```
prisma/
  schema.prisma              # Add category field to Video model
app/
  routes/
    admin.videos.tsx          # FIX: persist category, fix tags array
    videos._index.tsx         # NEW: public video listing with category filter
  utils/
    video.prisma.ts           # UPDATE: add getVideosByCategory, fix types
components/
  video/
    videoList.tsx             # UPDATE or REPLACE: modernize for public listing
```

### Pattern 1: Schema Migration (Add Category)
**What:** Add `category String` field to the Video model in Prisma schema
**When to use:** Now -- the admin form already collects category but it is silently dropped
**Example:**
```prisma
model Video {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt   DateTime @db.Date
  creatorName String
  description String
  category    String                  // NEW FIELD
  tags        String[]
  title       String
  updatedAt   DateTime @db.Date
  url         String
  translation Json?
}
```
After schema change: `npm run prisma:generate` then `npm run prisma:push`

### Pattern 2: Public Route with Category Filtering
**What:** Remix loader fetches all videos, client filters by category using URL search params
**When to use:** For the public `/videos` route
**Example:** Follow the pattern from `exercises._index.tsx`:
- Loader fetches all videos (with i18n localization applied)
- Client-side `Category` model provides filter options
- `useSearchParams` + URL params for filter state
- No authentication required (public page)

### Pattern 3: YouTube Thumbnail Extraction
**What:** Extract YouTube video ID from URL to build thumbnail URL
**When to use:** For video cards on the public listing page
**Example:** Already implemented in `components/admin/VideoCard.tsx`:
```typescript
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}
// Thumbnail: https://img.youtube.com/vi/${videoId}/mqdefault.jpg
```

### Anti-Patterns to Avoid
- **Embedding iframes on listing page:** Loading 12+ YouTube iframes kills page performance. Use thumbnails on the listing, link to YouTube (VID-03 embedded player is v2).
- **Duplicating category/tag logic:** Reuse the existing `Category` and `TAGS` models from `services/models/models.ts` -- do not create separate video-specific category constants.
- **Storing category in tags array:** The current code puts category into `tags: [tags]` as a single element. Category and tags are semantically different; store them in separate fields.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YouTube URL validation | Custom regex parser | Simple check for youtube.com or youtu.be domain + existing `extractYouTubeId` | Edge cases with YouTube URL formats are many |
| Category constants | New video-specific categories | Existing `Category`/`Category_En` from `services/models/models.ts` | Consistency with exercises; shared math domain |
| i18n content resolution | Custom translation parser | `getLocalizedContent`/`getLocalizedList` from `~/utils/i18n.server.ts` | Already handles JSON parsing, fallback logic |
| CSRF/audit/validation | Custom middleware | Existing `csrf.server.ts`, `audit.server.ts`, `validators.server.ts` | Already battle-tested in admin route |

**Key insight:** Nearly all infrastructure already exists. The work is schema correction, wiring the category field through the stack, and creating one new public route.

## Common Pitfalls

### Pitfall 1: Category Field Missing from Schema
**What goes wrong:** Admin form collects category but `createVideo` never stores it because the Prisma model has no `category` field. Videos appear uncategorized.
**Why it happens:** The Video schema was created before category was added to the admin form.
**How to avoid:** Add `category String` to the Video model FIRST, regenerate Prisma client, then update `createVideo`/`updateVideo` in `video.prisma.ts`.
**Warning signs:** `prisma:generate` fails or category value is silently dropped.

### Pitfall 2: Tags Stored as Single-Element Array
**What goes wrong:** `tags: tags ? [tags] : []` in `createVideo` always creates a one-element array. The edit form reads `video.tags[0]` as both category and tag.
**Why it happens:** The form sends `tags` as a single string value from a `<select>`, and it gets wrapped in an array.
**How to avoid:** With category now a separate field, tags should be a proper comma-separated-to-array conversion or multi-select. At minimum, stop conflating category and tags.
**Warning signs:** STATE.md already flags this: "Video tags stored as single-element arrays -- fix needed in Phase 5"

### Pitfall 3: Existing Video Data Without Category
**What goes wrong:** After adding `category` field, existing videos in MongoDB have no category value, causing null/empty displays.
**Why it happens:** MongoDB doesn't enforce schema; existing documents won't have the new field.
**How to avoid:** Either (a) make `category` optional with a default, (b) backfill existing records, or (c) handle null gracefully in the UI with an "Uncategorized" fallback.
**Warning signs:** Public listing shows blank category badges or filtering misses existing videos.

### Pitfall 4: YouTube URL Format Variations
**What goes wrong:** Users paste URLs like `youtube.com/embed/...`, `youtube.com/shorts/...`, `m.youtube.com/...` and thumbnail extraction fails.
**Why it happens:** YouTube has many valid URL formats.
**How to avoid:** The existing `extractYouTubeId` regex covers `watch?v=` and `youtu.be/` formats. Consider adding `/embed/` and `/shorts/` patterns. Always show a fallback when ID extraction fails (already handled in VideoCard).
**Warning signs:** Thumbnail shows placeholder SVG instead of actual video thumbnail.

## Code Examples

### Updated VideoInput Interface
```typescript
// video.prisma.ts - add category to interface
interface VideoInput {
  title: string;
  url: string;
  description: string;
  creatorName: string;
  category: string;     // NEW
  tags: string[];
  translation?: Prisma.InputJsonValue;
}
```

### Public Video Loader Pattern
```typescript
// videos._index.tsx loader (no auth required)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const videos = await getAllVideos();
  // Apply i18n if language param is set
  const url = new URL(request.url);
  const lang = getLanguageFromRequest(url.searchParams);
  const localizedVideos = getLocalizedList(videos, lang);
  return data({ videos: localizedVideos });
};
```

### Category Filter UI Pattern
```typescript
// Reuse Category model for filter buttons/tabs
{Object.values(Category.byId)
  .filter(c => !c.unavailable)
  .map(cat => (
    <button
      key={cat.id}
      onClick={() => setCategory(cat.name)}
      className={category === cat.name ? "bg-orange-500 text-white" : "bg-gray-100"}
    >
      {cat.name}
    </button>
  ))}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `components/video/videoList.tsx` with inline iframe | `VideoCard` with YouTube thumbnail + lazy loading | Phase 5 admin work (pre-existing) | Better performance, no iframe on listing |
| Category stored nowhere | Category as proper Prisma field | This phase | Enables browse-by-category requirement |

**Deprecated/outdated:**
- `components/video/videoList.tsx`: Old component with iframe embed, no i18n, no category support. Should be replaced or heavily refactored for the public route.

## Open Questions

1. **Should category be required or optional on existing videos?**
   - What we know: Existing videos in MongoDB have no category field. New videos will have one from the admin form.
   - What's unclear: How many existing videos are in the database.
   - Recommendation: Make category optional in schema (`String?`), display "Uncategorized" as fallback, and allow admin to edit existing videos to add category via the existing edit form.

2. **Should the public page use client-side or server-side filtering?**
   - What we know: Exercises use client-side filtering (loads all, filters in browser). Works fine for < 200 items.
   - What's unclear: Expected video count long-term.
   - Recommendation: Start with client-side filtering (consistent with exercises pattern). Video count will be small (tens, not hundreds). Server-side can be added later if needed.

3. **Should tags support multi-select?**
   - What we know: Current admin form uses single `<select>` for tags. STATE.md flags single-element arrays as a known issue.
   - What's unclear: Whether admin needs multiple tags per video.
   - Recommendation: Fix to support at least one proper tag. Multi-select is nice-to-have but not in requirements. Minimum: separate category from tags so they are not conflated.

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma` - Video model definition (no category field confirmed)
- `app/routes/admin.videos.tsx` - Full admin CRUD with CSRF, audit, i18n (category collected but not persisted)
- `app/utils/video.prisma.ts` - Data access layer (VideoInput lacks category)
- `components/admin/VideoCard.tsx` - YouTube ID extraction, thumbnail pattern, edit/delete UI
- `components/admin/VideoUploadForm.tsx` - Form with CategorySelect component
- `app/routes/exercises._index.tsx` - Client-side category filtering pattern (reference)
- `services/models/models.ts` - Category and TAGS constants (Greek + English)
- `.planning/STATE.md` - Confirms tags single-element array blocker

### Secondary (MEDIUM confidence)
- `components/video/videoList.tsx` - Older public video component (may need replacement)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies needed, all patterns already in codebase
- Architecture: HIGH - admin CRUD exists, just needs schema fix + one new public route
- Pitfalls: HIGH - gaps are clearly documented in STATE.md and confirmed by code inspection

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable; no external dependency changes expected)
