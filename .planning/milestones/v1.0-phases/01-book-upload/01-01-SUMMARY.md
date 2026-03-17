---
phase: 01-book-upload
plan: 01
subsystem: database, api
tags: [prisma, cloudinary, streaming-upload, soft-delete, validation, mongodb]

# Dependency graph
requires:
  - phase: none
    provides: "Existing Book model, Cloudinary utilities, validators"
provides:
  - "Extended Book Prisma model with authorName, pageCount, isbn, edition, discountPrice, deletedAt, archivedPdfIds, thumbnailPublicId"
  - "uploadStreamToCloudinary function for large file streaming to Cloudinary"
  - "Pure data access layer (books.prisma.ts) decoupled from Cloudinary"
  - "softDeleteBook replacing hard delete"
  - "PDF archive-on-replace via archivedPdfIds"
  - "Book-specific validators (PDF 100MB, thumbnail image, price, required fields)"
affects: [01-book-upload plan 02, 02-book-commerce]

# Tech tracking
tech-stack:
  added: []
  patterns: [streaming-upload-to-cloudinary, soft-delete-with-deletedAt, pdf-archive-on-replace, data-access-decoupled-from-uploads]

key-files:
  created: []
  modified:
    - prisma/schema.prisma
    - app/utils/cloudinary.server.ts
    - app/utils/books.prisma.ts
    - app/utils/validators.server.ts

key-decisions:
  - "Used Prisma.InputJsonValue type for translation field to fix pre-existing type error"
  - "PDF archive uses two-step update: first push old ID to archivedPdfIds, then update remaining fields"
  - "getAllBooks filters by both isActive=true AND deletedAt=null when activeOnly is true"

patterns-established:
  - "Streaming upload: uploadStreamToCloudinary uses writeAsyncIterableToWritable to pipe AsyncIterable directly to Cloudinary upload_stream"
  - "Soft delete: softDeleteBook sets isActive=false + deletedAt timestamp, no data or file deletion"
  - "PDF archive: old cloudinaryPublicId pushed to archivedPdfIds array on replacement, never deleted from Cloudinary"
  - "Data access decoupling: books.prisma.ts is pure database operations, Cloudinary calls handled by route actions"

requirements-completed: [BOOK-01]

# Metrics
duration: 5min
completed: 2026-02-24
---

# Phase 1 Plan 01: Book Schema + Streaming Upload + Data Layer Summary

**Extended Book Prisma model with 8 new fields, streaming Cloudinary upload function, decoupled book CRUD with soft delete and PDF archive, and book-specific validators**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-24T17:18:21Z
- **Completed:** 2026-02-24T17:23:19Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Extended Book model with authorName, pageCount, isbn, edition, discountPrice, deletedAt, archivedPdfIds, thumbnailPublicId
- Added streaming upload function (uploadStreamToCloudinary) for large PDF uploads up to 100MB without loading file into memory
- Decoupled book data access from Cloudinary -- books.prisma.ts is now a pure database module
- Replaced hard delete with soft delete (softDeleteBook)
- PDF replacement archives old public IDs instead of deleting files from Cloudinary
- Added 4 book-specific validators for PDF, thumbnail, price, and required fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Book Prisma schema and add streaming Cloudinary upload + book validators** - `81cd8f0` (feat)
2. **Task 2: Refactor books.prisma.ts for streaming uploads, new fields, soft delete, and PDF archive** - `06c0f28` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added 8 new fields to Book model (authorName, pageCount, isbn, edition, discountPrice, deletedAt, archivedPdfIds, thumbnailPublicId)
- `app/utils/cloudinary.server.ts` - Added uploadStreamToCloudinary function using writeAsyncIterableToWritable for streaming
- `app/utils/validators.server.ts` - Added validateBookPdf (100MB max), validateBookThumbnail (image only), validateBookPrice, validateBookFields
- `app/utils/books.prisma.ts` - Complete rewrite: removed Cloudinary imports, updated interfaces with new fields, implemented soft delete, PDF archive-on-replace

## Decisions Made
- Used `Prisma.InputJsonValue` type for translation field instead of `Record<string, unknown>` to fix pre-existing type mismatch with Prisma generated types
- PDF archive uses a two-step Prisma update: first pushes old public ID to archivedPdfIds, then applies remaining field updates, to safely use Prisma's `push` array operation
- `getAllBooks` with `activeOnly=true` now filters by both `isActive: true` AND `deletedAt: null` to properly exclude soft-deleted books

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed translation type for Prisma compatibility**
- **Found during:** Task 2 (books.prisma.ts refactor)
- **Issue:** Pre-existing TypeScript error: `Record<string, unknown>` not assignable to Prisma's `InputJsonValue` type for the translation field
- **Fix:** Changed `translation` type in BookInput and BookUpdateInput interfaces from `Record<string, unknown>` to `Prisma.InputJsonValue`
- **Files modified:** `app/utils/books.prisma.ts`
- **Verification:** `npx tsc --noEmit` shows no errors for books.prisma.ts
- **Committed in:** `06c0f28` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Type fix was necessary for correctness. No scope creep.

## Issues Encountered
- ESLint infrastructure issue: `structuredClone is not defined` error prevents ESLint from running on any file (Node.js version incompatibility with installed ESLint). This is a pre-existing environment issue, not caused by plan changes.
- Pre-existing TypeScript errors in `uploadEx.tsx`, `video.prisma.ts`, `uploadBook.tsx`, `uploadTutorial.tsx` are unrelated to this plan's changes and out of scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Book schema is extended and Prisma client is regenerated -- ready for Plan 02 to build admin route
- Streaming upload function is available for the route action's multipart upload handler
- Book CRUD functions are ready for import by the admin.books route
- Validators are ready for server-side validation in the route action
- Note: `npx prisma db push` needs to be run manually by the user to sync schema to MongoDB

## Self-Check: PASSED

All files verified present. All commits verified in git history.

---
*Phase: 01-book-upload*
*Completed: 2026-02-24*
