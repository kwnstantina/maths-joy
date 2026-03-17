# Phase 1: Book Upload - Research

**Researched:** 2026-02-24
**Domain:** Admin book catalog CRUD with file uploads (PDF + image) via Remix 2 + Cloudinary + Prisma/MongoDB
**Confidence:** HIGH

## Summary

Phase 1 enables the admin to create, list, edit, and soft-delete books with full metadata and file assets. The codebase already has significant scaffolding: a `Book` Prisma model, a `books.prisma.ts` data access module with `createBook`/`updateBook`/`deleteBook`/`getAllBooks`/`toggleBookActive`, a Cloudinary server module with `uploadToCloudinary`/`uploadBufferToCloudinary`/`uploadImageWithTransform`/`deleteFromCloudinary`, an existing `UploadBook` component in the upload dashboard tab, and even an `uploadBook` action handler in `uploadEx.tsx`. The key work is: (1) extending the Book model with the new fields from user decisions (author, pageCount, ISBN, edition, discountPrice, i18n), (2) replacing the current base64 upload approach with streaming for 100MB PDFs, (3) building a dedicated `/admin/books` route with card-grid listing + inline editing + soft delete + visibility toggle, and (4) wiring CSRF, rate limiting, audit logging, and admin auth guards.

The most critical technical challenge is the **100 MB PDF upload limit**. The current codebase converts files to base64 client-side then sends them in FormData -- this doubles memory usage (base64 is ~33% larger) and will fail for 100MB files. The solution is to use Remix's `unstable_parseMultipartFormData` with a custom upload handler that streams directly to Cloudinary's `upload_stream`, never holding the entire file in memory. This also requires Cloudinary's `upload_large` or chunked upload for files near/above 100MB on paid plans (free plan caps raw files at 10MB).

**Primary recommendation:** Refactor the upload flow to use streaming multipart parsing with a Cloudinary upload handler, extend the Book model schema, and build a dedicated admin books management route with inline card editing.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fields: title, description, price (EUR), discount price (optional), category, tags, author name, page count, ISBN, edition
- Categories: reuse the same category system as exercises (shared predefined dropdown)
- Pricing: EUR with original price + optional discount/sale price
- i18n: both Greek and English fields on upload (title_el, title_en, description_el, description_en) -- use the existing `translation` JSON field pattern on the Book model
- Book PDF: max 100 MB, uploaded to Cloudinary
- Thumbnail: required, JPEG or PNG, any size -- Cloudinary handles optimization
- Preview: show both PDF first page preview and thumbnail image preview before submitting
- Validation: reject non-PDF files for book, reject non-image files for thumbnail
- Location: separate admin page (`/admin/books` or similar dedicated route)
- Layout: card grid with thumbnail covers, title, price, category, active status
- Sorting: simple list, newest first -- no sort/filter controls needed
- Visibility toggle: books have active/inactive state -- inactive books hidden from students but visible to admin
- Draft workflow: admin can upload a book as inactive, then toggle active when ready
- Price: freely editable anytime, no restrictions
- PDF replacement: admin can upload new PDF version -- old PDF archived (kept in Cloudinary), new one becomes active
- Editing: inline on the card -- click edit, fields become editable in place on the card
- Delete: soft delete only -- book becomes invisible but data and files remain in DB and Cloudinary
- No confirmation dialog needed for soft delete since it's reversible

### Claude's Discretion
- Upload progress indicator design
- Card layout specifics (grid columns, spacing, responsive breakpoints)
- Form validation error messages
- Loading states during upload

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BOOK-01 | Admin can upload book PDF with thumbnail, title, description, category, tags, price | Existing `books.prisma.ts` CRUD functions, Cloudinary upload utilities, `uploadEx.tsx` book action handler, `UploadBook` component, `Book` Prisma model, shared `Category`/`TAGS` models, CSRF/rate-limit/audit patterns from `contact.tsx`. Schema needs new fields (author, pageCount, ISBN, edition, discountPrice). Upload flow needs streaming refactor for 100MB PDFs. New admin route needed for dedicated management page. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@remix-run/node` | ^2.15.2 | Server runtime, `unstable_parseMultipartFormData`, `writeAsyncIterableToWritable` | Project's framework; provides streaming upload handlers |
| `@remix-run/react` | ^2.15.2 | Client components, `Form`, `useFetcher`, `useNavigation` | Project's framework |
| `cloudinary` | ^2.5.1 | File storage (PDF + images), `upload_stream`, `upload_large` | Already configured in `cloudinary.server.ts` |
| `@prisma/client` | ^5.22.0 | Database ORM for MongoDB | Already configured with Book model |
| `react` | ^18.3.1 | UI framework | Project standard |
| `@headlessui/react` | ^2.2.0 | Accessible UI primitives (Tab, Switch, Dialog) | Already used in `uploadEx.tsx` tabs |
| `@heroicons/react` | ^2.2.0 | Icons | Already used in cards and UI |
| `tailwindcss` | ^3.4.17 | Styling | Project standard |
| `react-i18next` | (installed) | Client-side translations | Project standard |

### Supporting (no new installs needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `i18next-fs-backend` | (installed) | Server-side translation loading | Loader functions needing locale |
| `bcryptjs` | (installed) | Auth (session validation) | Admin auth guard in loaders |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Base64 client-side encoding | Streaming multipart with `unstable_parseMultipartFormData` | **Must use streaming** -- base64 doubles memory for 100MB files, will crash the server |
| `@mjackson/form-data-parser` | Remix built-in `unstable_parseMultipartFormData` | Third-party package; Remix built-in is sufficient and already available |
| React PDF viewer for preview | HTML5 `<object>` or `<iframe>` for PDF preview | No extra dependency needed; `<object type="application/pdf">` with `URL.createObjectURL()` works for client-side preview |

**Installation:**
```bash
# No new packages needed -- all dependencies are already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/routes/
├── admin.books.tsx            # Admin book management (list + create + inline edit)
app/utils/
├── books.prisma.ts            # EXTENDED: add new fields, soft delete, archive logic
├── cloudinary.server.ts       # EXTENDED: add streaming upload function
├── validators.server.ts       # EXTENDED: add book-specific validators
components/
├── admin/
│   └── BookCard.tsx            # Admin book card with inline editing + toggle + soft delete
│   └── BookUploadForm.tsx      # Book creation form with streaming file uploads
public/locales/
├── el/common.json             # EXTENDED: new admin.books.* keys
├── en/common.json             # EXTENDED: new admin.books.* keys
prisma/
├── schema.prisma              # EXTENDED: new Book model fields
```

### Pattern 1: Streaming Upload to Cloudinary via Custom Upload Handler
**What:** Use `unstable_parseMultipartFormData` with a custom upload handler that pipes file bytes directly to Cloudinary's `upload_stream`, avoiding loading the entire file into memory.
**When to use:** Any file upload over a few MB, especially the 100MB PDF requirement.
**Example:**
```typescript
// Source: Remix docs (file uploads guide) + Cloudinary Node.js docs
import {
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  writeAsyncIterableToWritable,
} from "@remix-run/node";
import { cloudinary } from "~/utils/cloudinary.server";

async function uploadStreamToCloudinary(
  data: AsyncIterable<Uint8Array>,
  options: { folder: string; resource_type: "raw" | "image"; tags?: string[] }
): Promise<{ public_id: string; secure_url: string; bytes: number }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resource_type,
        tags: options.tags,
        access_mode: "public",
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          bytes: result.bytes,
        });
      }
    );
    writeAsyncIterableToWritable(data, uploadStream).catch(reject);
  });
}
```

### Pattern 2: Admin Route with Loader Auth Guard + CSRF
**What:** Remix route with `loader` that checks admin role and provides CSRF token, `action` that validates CSRF + rate limit + admin auth before processing mutations.
**When to use:** All admin-only routes.
**Example:**
```typescript
// Source: Existing codebase patterns (contact.tsx, uploadEx.tsx)
import { getUser, requireUserId } from "~/utils/auth.prisma";
import { isAdmin } from "~/utils/roles";
import { getCSRFToken, validateCSRFToken } from "~/utils/csrf.server";
import { applyRateLimit } from "~/utils/ratelimit.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!isAdmin(user)) throw redirect("/progress");

  const { token, headers } = await getCSRFToken(request);
  const books = await getAllBooks(); // includes inactive
  return data({ books, csrfToken: token, user }, { headers });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  if (!isAdmin(user)) throw redirect("/progress");

  const rateLimitResponse = applyRateLimit(request, "upload", userId);
  if (rateLimitResponse) return rateLimitResponse;
  // ... parse multipart, validate CSRF, process action
};
```

### Pattern 3: Inline Card Editing with Fetcher
**What:** Each book card has an edit mode toggled by local state. Edit mode renders inputs in place of text. Save uses `useFetcher` to submit without full-page navigation.
**When to use:** The admin book list inline editing requirement.
**Example:**
```typescript
// Source: Remix docs (useFetcher)
function BookCard({ book, csrfToken }: { book: Book; csrfToken: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {isEditing ? (
        <fetcher.Form method="post" encType="multipart/form-data">
          <input type="hidden" name="_csrf" value={csrfToken} />
          <input type="hidden" name="_action" value="updateBook" />
          <input type="hidden" name="bookId" value={book.id} />
          {/* Inline editable fields */}
        </fetcher.Form>
      ) : (
        // Display mode with thumbnail, title, price, status badge
      )}
    </div>
  );
}
```

### Pattern 4: Soft Delete (isActive = false + deletedAt timestamp)
**What:** Soft delete sets `isActive: false` and optionally a `deletedAt` timestamp. Data and Cloudinary files remain intact.
**When to use:** The user-decided delete behavior -- reversible, no data loss.
**Example:**
```typescript
// In books.prisma.ts
export async function softDeleteBook(id: string) {
  return prisma.book.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
```

### Pattern 5: i18n Translation JSON Field
**What:** Store Greek fields as the primary model fields, store English translations in the `translation` JSON field using `createTranslation`/`serializeTranslation` from `i18n.server.ts`.
**When to use:** All translatable content on Book creation/editing.
**Example:**
```typescript
// Source: Existing i18n.server.ts
import { createTranslation } from "~/utils/i18n.server";

const translation = createTranslation(
  { title: titleEl, description: descriptionEl },
  { title: titleEn, description: descriptionEn }
);
// Store in Book.translation field
```

### Anti-Patterns to Avoid
- **Base64 encoding for large files:** The current `InternalFunctions.getBase64()` pattern reads the entire file into a base64 string client-side, then sends it in FormData. For a 100MB PDF, this creates a ~133MB string in memory. Use streaming multipart upload instead.
- **`request.formData()` for file uploads:** Loads entire file into server memory. Use `unstable_parseMultipartFormData` with a streaming handler.
- **Hard delete of books:** User explicitly requires soft delete -- never call `prisma.book.delete()` from the admin UI.
- **Deleting old PDF from Cloudinary on replacement:** User wants old PDFs archived (kept), not deleted. The current `updateBook` in `books.prisma.ts` calls `deleteFromCloudinary` for old PDFs -- this must be changed to archive behavior.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File upload streaming | Custom multipart parser | `unstable_parseMultipartFormData` + `writeAsyncIterableToWritable` | Handles streaming, backpressure, memory management correctly |
| CSRF protection | Custom token system | Existing `csrf.server.ts` (`getCSRFToken`, `validateCSRFToken`) | Already implemented with timing-safe comparison |
| Rate limiting | Custom counter | Existing `ratelimit.server.ts` (`applyRateLimit`) | Already has upload rate limit (5/hr) |
| Audit logging | Custom logging | Existing `audit.server.ts` (`logAuditEvent`) | Already structured for upload events |
| Admin auth guard | Custom middleware | Existing `getUser()` + `isAdmin()` | Already implemented and used across routes |
| Image optimization | Manual resize | Cloudinary `uploadImageWithTransform()` | Already configured with fill crop |
| Price formatting | Custom formatter | `Intl.NumberFormat` (already used in `books._index.tsx`) | Browser native, locale-aware |
| Category/Tags dropdowns | Custom list | Existing `Category`/`TAGS` from `services/models/models.ts` | Already used by exercises and existing book form |

**Key insight:** ~80% of the infrastructure already exists. The main new code is the streaming upload handler, the dedicated admin route, and the inline card editing UI.

## Common Pitfalls

### Pitfall 1: Base64 Memory Explosion for Large PDFs
**What goes wrong:** Converting a 100MB PDF to base64 creates a 133MB string. Sending it through FormData effectively triples memory usage (original + base64 + parsed). Node.js will crash or Vercel will reject the request.
**Why it happens:** The existing upload pattern (`InternalFunctions.getBase64()` -> FormData -> action -> Cloudinary) was designed for small exercise PDFs, not 100MB books.
**How to avoid:** Use `unstable_parseMultipartFormData` with a custom Cloudinary upload handler that streams bytes directly. On the client side, submit the form normally with `encType="multipart/form-data"` -- do NOT convert to base64.
**Warning signs:** Upload hangs, server OOM errors, Vercel 413 or 502 responses.

### Pitfall 2: Cloudinary Free Plan File Size Limits
**What goes wrong:** Cloudinary free plan limits raw file uploads to 10MB. A 100MB PDF will fail.
**Why it happens:** Free tier restrictions.
**How to avoid:** Ensure the Cloudinary account is on a paid plan (Plus or higher) which supports up to 100MB raw files (or larger by request). For files near 100MB, use `upload_large` or chunked upload. Document this as a deployment prerequisite.
**Warning signs:** Cloudinary API returns "File size too large" error.

### Pitfall 3: CSRF Token Not Available in Multipart Parsing
**What goes wrong:** When using `unstable_parseMultipartFormData`, the CSRF token (a regular form field) is processed through the upload handler too. If the upload handler only processes file fields, the CSRF token is lost.
**Why it happens:** `unstable_parseMultipartFormData` processes ALL form parts through the handler. You need `unstable_composeUploadHandlers` with `unstable_createMemoryUploadHandler` as fallback for non-file fields.
**How to avoid:** Use `unstable_composeUploadHandlers` to handle file fields with the Cloudinary handler and fall back to memory handler for text fields (like `_csrf`, `title`, `price`, etc.).
**Warning signs:** CSRF validation always fails on file upload forms.

### Pitfall 4: PDF Replacement Deletes the Old File
**What goes wrong:** The existing `updateBook` in `books.prisma.ts` calls `deleteFromCloudinary(existingBook.cloudinaryPublicId)` when a new PDF is uploaded. The user wants old PDFs archived, not deleted.
**Why it happens:** The current code was written with a different assumption about file lifecycle.
**How to avoid:** Remove the `deleteFromCloudinary` call from the PDF replacement flow. Optionally store the old public ID in an `archivedPdfIds` array on the Book model for reference.
**Warning signs:** Old PDF versions disappear from Cloudinary after replacement.

### Pitfall 5: Missing Schema Fields
**What goes wrong:** The user specified additional fields (author, pageCount, ISBN, edition, discountPrice) that do not exist on the current Book model. Attempting to save these fields will fail silently or throw Prisma errors.
**Why it happens:** The Book model was created as a minimal scaffold before requirements were finalized.
**How to avoid:** Add all required fields to `schema.prisma` and run `prisma:generate` + `prisma:push` before implementing the upload form.
**Warning signs:** Prisma validation errors, missing fields in the database.

### Pitfall 6: Form Data Access Order with Streaming
**What goes wrong:** With `unstable_parseMultipartFormData`, you cannot access form text values until the entire multipart stream is processed. If you try to read text fields to validate before file upload, they won't be available yet.
**Why it happens:** Multipart form data streams parts in order; all parts must be parsed before FormData is complete.
**How to avoid:** Parse the entire multipart form first, then validate text fields. If validation fails after the file is already uploaded to Cloudinary, delete the orphaned upload. Alternatively, validate required fields client-side first (before submit) to reduce wasted uploads.
**Warning signs:** Text fields are `null` when accessed during upload handler execution.

### Pitfall 7: Vercel Serverless Function Size/Timeout Limits
**What goes wrong:** Vercel serverless functions have a 4.5MB request body limit (on free/hobby) and 10-second timeout. A 100MB PDF upload will fail.
**Why it happens:** Serverless platforms are not designed for large file uploads through the function.
**How to avoid:** For production, use Cloudinary's direct upload from the client (signed or unsigned upload preset) to bypass the server entirely. The server only receives the Cloudinary response (public_id, secure_url) to store in the database. This is the standard pattern for serverless + large files.
**Warning signs:** 413 Payload Too Large, function timeout errors on Vercel.

## Code Examples

Verified patterns from the existing codebase and official documentation:

### Streaming Upload Handler for Cloudinary
```typescript
// Source: Remix docs + Cloudinary Node.js docs
// File: app/utils/cloudinary.server.ts (new export)
import { writeAsyncIterableToWritable } from "@remix-run/node";
import { cloudinary, CloudinaryUploadResult } from "~/utils/cloudinary.server";

export async function uploadStreamToCloudinary(
  data: AsyncIterable<Uint8Array>,
  options: {
    folder: string;
    resource_type: "raw" | "image";
    tags?: string[];
    public_id?: string;
  }
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resource_type,
        tags: options.tags,
        public_id: options.public_id,
        access_mode: "public",
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            bytes: result.bytes,
            format: result.format,
            resource_type: result.resource_type,
            created_at: result.created_at,
          });
        }
      }
    );
    writeAsyncIterableToWritable(data, uploadStream).catch(reject);
  });
}
```

### Action with Composed Upload Handlers
```typescript
// Source: Remix docs (unstable_composeUploadHandlers)
import {
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Auth + rate limit checks first (before parsing body)
  const userId = await requireUserId(request);
  const user = await getUser(request);
  if (!isAdmin(user)) throw redirect("/progress");

  let pdfResult: CloudinaryUploadResult | null = null;
  let thumbnailResult: CloudinaryUploadResult | null = null;

  const uploadHandler = unstable_composeUploadHandlers(
    async ({ name, data, contentType }) => {
      if (name === "pdfFile" && contentType === "application/pdf") {
        pdfResult = await uploadStreamToCloudinary(data, {
          folder: "maths-joy/books",
          resource_type: "raw",
        });
        return pdfResult.secure_url;
      }
      if (name === "thumbnailFile" && contentType?.startsWith("image/")) {
        thumbnailResult = await uploadStreamToCloudinary(data, {
          folder: "maths-joy/book-thumbnails",
          resource_type: "image",
        });
        return thumbnailResult.secure_url;
      }
      return undefined; // Fall through to memory handler
    },
    unstable_createMemoryUploadHandler()
  );

  const formData = await unstable_parseMultipartFormData(request, uploadHandler);

  // Now validate CSRF + text fields
  const csrfToken = formData.get("_csrf") as string;
  const isValidCsrf = await validateCSRFToken(request, csrfToken);
  if (!isValidCsrf) {
    // Clean up uploaded files if CSRF fails
    // ...
    return data({ errors: { form: "Invalid form submission" } }, { status: 400 });
  }
  // Continue with creating/updating book...
};
```

### Extended Book Prisma Schema
```prisma
// Fields to add to existing Book model
model Book {
  // ... existing fields ...
  authorName         String?
  pageCount          Int?
  isbn               String?
  edition            String?
  discountPrice      Float?
  deletedAt          DateTime? @db.Date  // for soft delete tracking
  archivedPdfIds     String[]            // old PDF public IDs kept for archive
}
```

### Client-Side PDF Preview
```typescript
// Source: Standard Web API (URL.createObjectURL)
function PdfPreview({ file }: { file: File | null }) {
  if (!file) return null;
  const previewUrl = URL.createObjectURL(file);

  return (
    <object
      data={previewUrl}
      type="application/pdf"
      width="100%"
      height="400px"
    >
      <p>PDF preview not supported in this browser.</p>
    </object>
  );
}
```

### Translation Field Construction for Book
```typescript
// Source: Existing i18n.server.ts
import { createTranslation } from "~/utils/i18n.server";

// On form submission with both Greek and English fields:
const translation = createTranslation(
  { title: formData.get("title_el"), description: formData.get("description_el") },
  { title: formData.get("title_en"), description: formData.get("description_en") }
);
// Pass to prisma create/update as: translation: translation
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Base64 file encoding in FormData | Streaming multipart with `unstable_parseMultipartFormData` | Remix v1.7+ (2023) | Required for 100MB files; prevents memory explosion |
| Server-proxied uploads for large files | Direct-to-Cloudinary client uploads (signed presets) | Industry standard 2024+ | Bypasses serverless body limits; needed for Vercel deployment |
| `upload_stream` for all sizes | `upload_large` with chunking for >100MB | Cloudinary SDK v2+ | Required for very large files on paid plans |
| Hard delete | Soft delete with `isActive`/`deletedAt` | User decision | Data preservation, reversibility |

**Deprecated/outdated:**
- `request.formData()` for file uploads: Still works but loads entire file into memory. Use `unstable_parseMultipartFormData` instead.
- `InternalFunctions.getBase64()` for large files: Client-side base64 encoding. Fine for small files (<5MB), but must not be used for 100MB PDFs.
- Cloudinary `upload` (non-streaming): Limited to 100MB and loads file into memory. Use `upload_stream` or `upload_large` for large files.

## Open Questions

1. **Cloudinary Plan Tier**
   - What we know: Free plan limits raw uploads to 10MB. The user requires 100MB PDF uploads.
   - What's unclear: Whether the project's Cloudinary account is on a paid plan.
   - Recommendation: Verify the Cloudinary plan before implementation. If on free tier, either upgrade or reduce the max file size requirement. Document this as a prerequisite.

2. **Vercel Serverless Body Size Limit**
   - What we know: Vercel Hobby plan limits request bodies to 4.5MB for serverless functions. Pro plan allows up to 100MB (but may still timeout for large uploads).
   - What's unclear: Which Vercel plan the project is on, and whether the upload can be configured to bypass the function.
   - Recommendation: For production reliability, implement Cloudinary direct upload from the client using a signed upload preset. The server generates the signature, the client uploads directly to Cloudinary, and then submits only the metadata + Cloudinary response to the server action. This completely bypasses serverless limits. If staying with server-proxied uploads for simplicity during development, document the production limitation.

3. **PDF First Page Preview**
   - What we know: The user wants a PDF first page preview before submitting. Browser `<object type="application/pdf">` shows the full PDF, not just page 1.
   - What's unclear: Whether a full embedded PDF viewer is acceptable or only a static image of page 1 is expected.
   - Recommendation: Use `<object>` or `<iframe>` with `URL.createObjectURL(file)` for a simple in-browser preview. For a page-1-only thumbnail, `pdfjs-dist` (Mozilla's PDF.js) can render page 1 to a canvas, but this adds a ~300KB dependency. Recommend starting with the simple `<object>` embed, which shows the full PDF and lets the admin scroll -- practical and zero extra dependencies.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `prisma/schema.prisma` -- Book model definition
- Existing codebase: `app/utils/books.prisma.ts` -- CRUD operations for books
- Existing codebase: `app/utils/cloudinary.server.ts` -- Upload/delete functions, `upload_stream` pattern
- Existing codebase: `app/routes/uploadEx.tsx` -- Existing upload route with book action handler
- Existing codebase: `components/uploadExTabs/uploadBook.tsx` -- Existing book upload form
- Existing codebase: `app/utils/csrf.server.ts`, `ratelimit.server.ts`, `audit.server.ts` -- Security patterns
- Existing codebase: `app/utils/i18n.server.ts` -- Translation helpers
- Existing codebase: `app/utils/roles.ts` -- Admin role checking
- Existing codebase: `services/models/models.ts` -- Category and TAGS definitions
- [Remix File Uploads Guide](https://remix.run/docs/en/main/guides/file-uploads) -- Official streaming upload documentation
- [Cloudinary Node.js Upload Docs](https://cloudinary.com/documentation/node_image_and_video_upload) -- upload_stream, upload_large

### Secondary (MEDIUM confidence)
- [Cloudinary File Size Limits](https://support.cloudinary.com/hc/en-us/articles/202520592-Do-you-have-a-file-size-limit) -- Plan-based limits verified
- [Remix unstable_parseMultipartFormData](https://remix.run/docs/en/main/utils/parse-multipart-form-data) -- Official API reference
- [Cloudinary Chunked Upload Guidelines](https://support.cloudinary.com/hc/en-us/articles/208263735-Guidelines-for-implementing-chunked-upload-to-Cloudinary) -- For files >100MB

### Tertiary (LOW confidence)
- Vercel body size limits -- Based on general knowledge of Vercel platform limits. Specific limits may vary by plan and configuration. Should be verified against current Vercel documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and in use in the codebase
- Architecture: HIGH -- Patterns derived directly from existing codebase patterns (contact.tsx, uploadEx.tsx, books._index.tsx)
- Pitfalls: HIGH -- Based on direct code analysis (base64 pattern, missing schema fields, Cloudinary delete behavior) and verified documentation (file size limits, streaming requirements)
- Open questions: MEDIUM -- Cloudinary plan tier and Vercel limits depend on deployment configuration not visible in the codebase

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (30 days -- stable stack, no fast-moving dependencies)
