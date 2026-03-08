# Phase 1: Book Upload - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can build and manage a book catalog with full metadata and file assets. This covers upload, listing, editing, and soft-deleting books. Student-facing catalog browsing and purchasing are Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Upload form fields
- Fields: title, description, price (EUR), discount price (optional), category, tags, author name, page count, ISBN, edition
- Categories: reuse the same category system as exercises (shared predefined dropdown)
- Pricing: EUR with original price + optional discount/sale price
- i18n: both Greek and English fields on upload (title_el, title_en, description_el, description_en) — use the existing `translation` JSON field pattern on the Book model

### File handling
- Book PDF: max 100 MB, uploaded to Cloudinary
- Thumbnail: required, JPEG or PNG, any size — Cloudinary handles optimization
- Preview: show both PDF first page preview and thumbnail image preview before submitting
- Validation: reject non-PDF files for book, reject non-image files for thumbnail

### Admin book list
- Location: separate admin page (`/admin/books` or similar dedicated route)
- Layout: card grid with thumbnail covers, title, price, category, active status
- Sorting: simple list, newest first — no sort/filter controls needed
- Visibility toggle: books have active/inactive state — inactive books hidden from students but visible to admin
- Draft workflow: admin can upload a book as inactive, then toggle active when ready

### Edit & delete behavior
- Price: freely editable anytime, no restrictions
- PDF replacement: admin can upload new PDF version — old PDF archived (kept in Cloudinary), new one becomes active
- Editing: inline on the card — click edit, fields become editable in place on the card
- Delete: soft delete only — book becomes invisible but data and files remain in DB and Cloudinary
- No confirmation dialog needed for soft delete since it's reversible

### Claude's Discretion
- Upload progress indicator design
- Card layout specifics (grid columns, spacing, responsive breakpoints)
- Form validation error messages
- Loading states during upload

</decisions>

<specifics>
## Specific Ideas

- Reuse exercise category system for book categories
- Follow the existing `uploadEx.tsx` upload tab pattern for the form layout
- Use Cloudinary's `uploadBufferToCloudinary()` and `uploadImageWithTransform()` for thumbnail optimization
- Book model already exists in Prisma schema with `isActive` flag, `cloudinaryPublicId`, `cloudinaryUrl`, `thumbnailUrl`, `stripeProductId`, `stripePriceId`, `translation` JSON field

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-book-upload*
*Context gathered: 2026-02-22*
