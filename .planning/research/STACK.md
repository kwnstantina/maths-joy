# Technology Stack

**Project:** GregKyrMaths v1.1 -- Platform Completion
**Researched:** 2026-03-17

## Verdict: No New Packages Required

Every feature in v1.1 (Q&A system, video management, bulk exercise upload, i18n completion) can be built entirely with the existing stack. The codebase already has the right primitives; this milestone is about composing them into new features, not adding dependencies.

## Existing Stack (Already Validated -- DO NOT CHANGE)

| Technology | Version | Purpose |
|------------|---------|---------|
| Remix 2 + Vite | ^2.15.2 | Full-stack framework, loaders/actions, file routing |
| React 18 | ^18.3.1 | UI components |
| TypeScript | ^5.7.2 | Type safety |
| Prisma + MongoDB | ^5.22.0 | ORM, schema at `prisma/schema.prisma` |
| Tailwind CSS | ^3.4.17 | Styling |
| Cloudinary | ^2.5.1 | File storage (PDFs, images) |
| remix-i18next | ^6.4.1 | Server/client i18n |
| i18next | ^23.16.8 | Translation runtime |
| @heroicons/react | ^2.2.0 | Icons |
| @headlessui/react | ^2.2.0 | Accessible UI primitives (modals, menus) |
| xss | ^1.0.15 | HTML sanitization |
| better-react-mathjax | ^2.0.3 | Math rendering in Q&A bodies |

## Feature-by-Feature Stack Mapping

### Q&A System (Voting, Accepted Answers, Search/Filter)

**What exists:**
- Prisma models: `Question`, `Answer`, `QuestionVote`, `AnswerVote` -- fully defined with vote counts, accepted answer tracking, tags, categories
- Data access layer: `qa.server.ts` -- complete CRUD, voting (toggle/change/remove), accept answer, search with `contains`/`mode: insensitive`, pagination, category grouping, popular tags
- Routes: `qa._index.tsx` (listing with search/filter/pagination), `qa.$questionId.tsx` (detail), `qa.ask.tsx` (create form)
- Admin: `admin.qa.tsx` exists

**What to build with existing stack:**
- Vote UI components using Remix `useFetcher` (optimistic updates without full page reload)
- Answer submission form with CSRF protection (pattern from `admin.videos.tsx`)
- Accept answer button (question author only) -- `acceptAnswer()` in `qa.server.ts` already handles the logic
- Math rendering in Q&A bodies using `better-react-mathjax` (already installed)
- XSS sanitization of Q&A body content using `xss` package (already installed)

**No new packages because:**
- Search uses Prisma's `contains` with `mode: insensitive` -- sufficient for a small-to-medium Q&A. MongoDB Atlas Search would be overkill for this scale.
- Voting is server-side with optimistic UI via `useFetcher` -- no need for client state management like Zustand or Redux.
- Rich text is NOT needed -- plain text + math notation covers a math Q&A. If markdown is ever desired, `marked` or `markdown-it` would be the addition, but this is explicitly not needed now.

### Video Link Management (YouTube)

**What exists:**
- Prisma model: `Video` with `url`, `title`, `description`, `tags[]`, `creatorName`, `translation` JSON field
- Data access: `video.prisma.ts` -- full CRUD, pagination
- Admin route: `admin.videos.tsx` -- complete create/update/delete with CSRF, audit logging, i18n translation support
- Components: `VideoUploadForm`, `VideoCard` in `components/admin/`
- Validators: `validateVideoFields()` in `validators.server.ts`

**What to build with existing stack:**
- Public video listing route (e.g., `videos._index.tsx`) with category/tag filtering -- same pattern as `qa._index.tsx`
- YouTube embed component -- a simple React component extracting the video ID from the URL. No package needed; `new URL(videoUrl)` + `searchParams.get('v')` handles YouTube URL parsing.
- Video detail page with embed + related videos
- Category field on Video model (schema change: add `category String` to Video model)

**No new packages because:**
- YouTube embedding is a 10-line component using an iframe with `youtube.com/embed/{id}`
- URL validation for YouTube links is a simple regex/URL parse
- No video upload, transcoding, or player SDK needed -- videos stay on YouTube

### Bulk Exercise Upload

**What exists:**
- Streaming upload: `uploadStreamToCloudinary()` in `cloudinary.server.ts` uses `upload_stream` + `writeAsyncIterableToWritable`
- Remix multipart parsing: `unstable_composeUploadHandlers`, `unstable_createMemoryUploadHandler`, `unstable_parseMultipartFormData` (already used in `admin.exercises.tsx`)
- Exercise creation: `createExerciseFromStream()` in `exersices.prisma.ts`
- Rate limiting: `applyRateLimit()` with `upload: 5/hr` preset

**What to build with existing stack:**
- Modified action handler that iterates over multiple `File` entries from a single `<input type="file" multiple>` form field
- Sequential Cloudinary uploads (parallel would hit rate limits) with progress tracking via Remix `useFetcher`
- Shared metadata (category, tags) applied to all files in the batch, with per-file title derived from filename
- Adjusted rate limit for bulk uploads (increase `upload` limit or add a separate `bulk_upload` limit)

**No new packages because:**
- HTML `<input type="file" multiple accept=".pdf">` handles multi-file selection natively
- `unstable_parseMultipartFormData` already handles multiple files in a single request
- `uploadStreamToCloudinary` processes one file at a time -- loop over files sequentially
- Progress feedback via `useFetcher` + action returning partial results, or a simple "X of Y uploaded" counter

**Architecture note:** For large batches (10+ files), consider processing uploads sequentially server-side and returning results as they complete. Remix's action model returns a single response, so the simplest approach is: upload all files in the action, return a summary. For UX, show a loading state with `useNavigation().state === "submitting"`. If real-time progress per file is needed later, that would require a streaming response or WebSocket -- but this is NOT needed for v1.1 where batch sizes are small (teacher uploading 5-10 exercises).

### i18n Completion

**What exists:**
- Infrastructure: `remix-i18next`, `i18next-fs-backend` (server), `i18next-http-backend` + `LanguageDetector` (client)
- Translation files: `public/locales/el/common.json` (442 lines), `public/locales/en/common.json` (441 lines)
- DB content i18n: `translation` JSON field on `Exersice`, `Book`, `Training`, `Video` models + `getLocalizedContent()`/`getLocalizedList()` helpers
- Admin forms: Already have `title_el`/`title_en`/`description_el`/`description_en` pattern (see `admin.videos.tsx`)

**What to build with existing stack:**
- Add Q&A-related translation keys to `el/common.json` and `en/common.json` (some Q&A keys like `qa.title`, `qa.askQuestion` already exist)
- Add video listing translation keys
- Add bulk upload translation keys
- Ensure all new routes export `handle = { i18n: ["common"] }`
- Apply `getLocalizedContent()` in loaders for Video listing (exercises and books already use it)

**No new packages because:**
- The i18n infrastructure is complete. This is purely content work: adding translation key-value pairs to the two JSON files.
- The `translation` JSON field pattern on models is well-established and doesn't need changing.

## Video Model Schema Addition

The Video model needs a `category` field to support filtering. This is a schema change, not a package addition:

```prisma
model Video {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt   DateTime @db.Date
  creatorName String
  description String
  category    String    // NEW: for category filtering
  tags        String[]
  title       String
  updatedAt   DateTime @db.Date
  url         String
  translation Json?
}
```

Run `npm run prisma:push` after the change. MongoDB does not require migrations -- existing records will have `category` as undefined/null until updated.

## What NOT to Add

| Package/Tool | Why NOT |
|-------------|---------|
| **Full-text search (Algolia, Meilisearch, Elasticsearch)** | Prisma `contains` with `mode: insensitive` is sufficient for the current scale. MongoDB Atlas Search is available if needed later without any package changes. |
| **Rich text editor (TipTap, Slate, Quill)** | Q&A is math-focused. Plain text + MathJax covers the use case. Adding a WYSIWYG editor adds bundle size and complexity for minimal gain. |
| **State management (Zustand, Redux, Jotai)** | Remix loaders/actions + `useFetcher` handle all data flow. Voting optimistic updates work fine with fetcher's `optimisticData` pattern. |
| **React Query / SWR** | Remix's built-in data revalidation after actions handles cache invalidation. No need for client-side caching layer. |
| **File upload library (react-dropzone, filepond)** | Native `<input type="file" multiple>` with Tailwind styling is sufficient. These libraries add drag-and-drop UX but also bundle weight. Can add later if teacher requests it. |
| **Form library (react-hook-form, Formik)** | Remix's `<Form>` with `useActionData` for errors is the established pattern. Adding a form library would break consistency with existing code. |
| **Markdown parser (marked, remark)** | Not needed for v1.1. Q&A bodies are plain text. If markdown support is added later, `marked` (12KB) would be the choice. |
| **YouTube API SDK** | Not needed. Embedding uses iframes. No server-side YouTube API calls are required -- videos are just URL references. |

## Alternatives Considered

| Category | Decision | Alternative | Why Not |
|----------|----------|-------------|---------|
| Q&A search | Prisma `contains` | MongoDB Atlas Search | Overkill for current scale; can migrate later without code changes since it's a MongoDB feature |
| Math in Q&A | `better-react-mathjax` (existing) | KaTeX | Already installed and working; KaTeX is faster but would mean maintaining two math renderers |
| Bulk upload UX | Native file input + sequential upload | react-dropzone + parallel upload | Simpler, no new dependency, teacher is sole uploader so UX polish is lower priority |
| Video embed | Raw iframe component | react-player | 48KB bundle for a feature that needs 10 lines of code |

## Installation

No installation needed. The existing `package.json` already contains everything required for v1.1.

```bash
# Only if starting fresh or after git clone:
npm install
npm run prisma:generate

# After Video model schema change:
npm run prisma:push
```

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Q&A stack | HIGH | Models, data layer, and routes already exist in codebase. Verified by reading `qa.server.ts`, `qa._index.tsx`, schema. |
| Video management | HIGH | Admin CRUD is fully built (`admin.videos.tsx`). Only public listing + embed needed. |
| Bulk upload | HIGH | Streaming upload infrastructure exists (`uploadStreamToCloudinary`). Multi-file is a loop over existing single-file pattern. |
| i18n completion | HIGH | Infrastructure fully validated. Pattern established across multiple admin routes. Pure content work. |
| No new packages needed | HIGH | Every feature maps to existing primitives. Verified against codebase, not assumed. |

## Sources

- Direct codebase analysis: `package.json`, `prisma/schema.prisma`, `app/utils/qa.server.ts`, `app/utils/video.prisma.ts`, `app/utils/exersices.prisma.ts`, `app/utils/cloudinary.server.ts`, `app/utils/i18n.server.ts`, `app/utils/validators.server.ts`, `app/routes/admin.videos.tsx`, `app/routes/admin.exercises.tsx`, `app/routes/qa._index.tsx`
- Remix documentation on `useFetcher` for optimistic updates (training data, HIGH confidence -- core Remix pattern)
- Prisma MongoDB `contains` with `mode: insensitive` (training data, HIGH confidence -- standard Prisma feature)
