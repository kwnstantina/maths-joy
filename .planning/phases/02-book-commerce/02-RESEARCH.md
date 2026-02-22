# Phase 2: Book Commerce - Research

**Researched:** 2026-02-22
**Domain:** Stripe Checkout integration, Book catalog browsing with category filtering, PDF download with token enforcement
**Confidence:** HIGH

## Summary

Phase 2 builds on top of significant existing infrastructure. The codebase already contains fully implemented (but partially buggy) routes for book browsing (`books._index.tsx`, `books.$bookId.tsx`), Stripe checkout (`stripe.server.ts`), webhook handling (`api.stripe-webhook.tsx`), download token verification (`download.$token.tsx`), and a purchases page (`purchases.tsx`). The Prisma schema for `Book` and `Purchase` is complete. Translation keys for books and purchases exist in both Greek and English.

The primary work for this phase is NOT greenfield development. Instead, it is: (1) adding category filtering to the existing book catalog listing, (2) fixing known bugs in the existing Stripe/download flow (download count limits not enforced, token expiration not checked, book.isActive not validated during download), and (3) adding CSRF protection and rate limiting to the purchase action. The existing code provides a solid 80% foundation; this phase fills the remaining gaps and hardens what exists.

**Primary recommendation:** Audit and fix the existing book commerce routes rather than rebuilding them. Add category filtering to `books._index.tsx`, enforce `downloadCount < maxDownloads` in `verifyDownloadToken()`, add `tokenExpiresAt` checking, and apply the project's existing CSRF/rate-limiting patterns to the purchase action.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BOOK-02 | Student can browse book catalog with categories | Existing `books._index.tsx` route loads all active books but lacks category filtering. Add `?category=X` search param filtering to the loader, and a category sidebar/dropdown to the UI. Use the same search params pattern as `exercises._index.tsx`. |
| BOOK-03 | Student can purchase book via Stripe checkout | Existing `books.$bookId.tsx` already has a working action that calls `createCheckoutSession()`. Needs CSRF token protection (project pattern: `requireCSRFToken()`), rate limiting (`applyRateLimit(request, 'api')`), and audit logging. |
| BOOK-04 | Stripe webhook processes payment and creates purchase record with download token | Existing `api.stripe-webhook.tsx` and `handlePaymentSuccess()` in `stripe.server.ts` handle `checkout.session.completed`. Download token is already generated pre-checkout in `createCheckoutSession()`. Needs idempotency check (webhook may fire multiple times) and `tokenExpiresAt` to be set on the purchase record. |
| BOOK-05 | Student can download purchased book PDF (limited download count) | Existing `download.$token.tsx` works but `verifyDownloadToken()` does NOT enforce `downloadCount < maxDownloads` (schema has both fields, code ignores the limit). Must also check `tokenExpiresAt` and `book.isActive`. Rate limiting for downloads should use `applyRateLimit(request, 'download')`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | ^17.4.0 | Stripe Checkout Sessions, webhook verification | Already installed and configured in `app/utils/stripe.server.ts` |
| @prisma/client | ^5.22.0 | Database access for Book, Purchase models | Already installed; schema complete |
| @remix-run/node | ^2.15.2 | Server-side loaders/actions, Response handling | Project framework |
| @remix-run/react | ^2.15.2 | Client-side routing, Form, useLoaderData | Project framework |
| react-i18next | ^15.1.3 | Translation hooks for UI text | Already used in existing book routes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cloudinary | ^2.5.1 | Signed URL generation for secure PDF download | Already configured in `cloudinary.server.ts`; use `generateSignedUrl()` for authenticated downloads |
| crypto (Node built-in) | N/A | Download token generation | Already used in `stripe.server.ts` via `crypto.randomBytes(32)` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloudinary public URL for PDF | Cloudinary signed/authenticated URL | Current code uses public URL (`book.cloudinaryUrl`). Signed URLs would add expiration but require re-uploading books as `authenticated` type. Keep public URL for now since download is gated by token verification. |
| In-memory rate limiting | Redis-based rate limiting | Current in-memory store resets on server restart and doesn't work across multiple instances. Acceptable for single-instance Vercel deployment. |
| URL param download tokens | POST+redirect pattern | Current approach exposes token in URL/browser history. POST+redirect is more secure but more complex. Keep current approach since tokens are single-purpose and rate-limited. |

**Installation:**
No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Existing Project Structure (Relevant Files)
```
app/
  routes/
    books._index.tsx        # Book catalog listing (EXISTS - needs category filter)
    books.$bookId.tsx       # Book detail + purchase action (EXISTS - needs CSRF/rate limit)
    api.stripe-webhook.tsx  # Webhook handler (EXISTS - needs idempotency)
    download.$token.tsx     # PDF download (EXISTS - needs limit enforcement)
    purchases.tsx           # Purchase history (EXISTS - mostly complete)
  utils/
    stripe.server.ts        # Stripe checkout, webhook handlers, token verify (EXISTS)
    books.prisma.ts         # Book CRUD operations (EXISTS)
    cloudinary.server.ts    # File upload/download/signed URLs (EXISTS)
    csrf.server.ts          # CSRF token generation/validation (EXISTS)
    ratelimit.server.ts     # Rate limiting per action type (EXISTS)
    audit.server.ts         # Security event logging (EXISTS)
    i18n.server.ts          # Localization helpers (EXISTS)
    validators.server.ts    # Input validation (EXISTS)
public/
  locales/
    en/common.json          # English translations (EXISTS - books.* and purchases.* keys present)
    el/common.json          # Greek translations (EXISTS - books.* and purchases.* keys present)
```

### Pattern 1: Category Filtering via Search Params (Remix Convention)
**What:** Use URL search parameters for category filtering, processed in the loader function
**When to use:** Any list page that needs filterable results without full page reloads
**Example:**
```typescript
// In books._index.tsx loader
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const locale = await i18next.getLocale(request);

  const where: Prisma.BookWhereInput = { isActive: true };
  if (category) {
    where.category = category;
  }

  const books = await prisma.book.findMany({
    where,
    select: { /* existing fields */ },
    orderBy: { createdAt: "desc" },
  });

  // Get distinct categories for the filter UI
  const categories = await prisma.book.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
  });

  const localizedBooks = getLocalizedList(books, locale);
  return data({ books: localizedBooks, categories, locale, selectedCategory: category });
};
```

### Pattern 2: CSRF + Rate Limiting on Actions (Existing Project Pattern)
**What:** Apply CSRF validation and rate limiting before processing form actions
**When to use:** Any action that modifies state or initiates payment
**Example:**
```typescript
// In books.$bookId.tsx action
export const action: ActionFunction = async ({ request, params }) => {
  // 1. CSRF validation
  const csrfError = await requireCSRFToken(request);
  if (csrfError) return csrfError;

  // 2. Rate limiting
  const user = await getUser(request);
  if (!user) return redirect(`/login?redirectTo=/books/${params.bookId}`);

  const rateLimitResponse = applyRateLimit(request, 'api', user.id);
  if (rateLimitResponse) return rateLimitResponse;

  // 3. Audit logging
  const { ipAddress, userAgent } = getClientInfo(request);
  await logAuditEvent({
    userId: user.id,
    action: 'purchase',
    resource: 'book',
    resourceId: params.bookId,
    ipAddress,
    userAgent,
  });

  // 4. Existing checkout logic...
};
```

### Pattern 3: Download Count Enforcement
**What:** Check `downloadCount < maxDownloads` before serving file
**When to use:** In `verifyDownloadToken()` when validating download requests
**Example:**
```typescript
// In stripe.server.ts - verifyDownloadToken
export async function verifyDownloadToken(token: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { downloadToken: token },
  });

  if (!purchase || purchase.status !== 'completed') return null;

  // NEW: Check download count limit
  if (purchase.downloadCount >= purchase.maxDownloads) return null;

  // NEW: Check token expiration
  if (purchase.tokenExpiresAt && purchase.tokenExpiresAt < new Date()) return null;

  const book = await prisma.book.findUnique({
    where: { id: purchase.bookId },
  });

  // NEW: Check book is still active
  if (!book || !book.isActive) return null;

  // Increment download count
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { downloadCount: { increment: 1 } },
  });

  return { bookId: book.id, cloudinaryUrl: book.cloudinaryUrl, title: book.title };
}
```

### Pattern 4: Idempotent Webhook Handling
**What:** Ensure webhook handler doesn't process the same event twice
**When to use:** In the Stripe webhook action, before calling `handlePaymentSuccess()`
**Example:**
```typescript
// In handlePaymentSuccess - add idempotency check
export async function handlePaymentSuccess(sessionId: string): Promise<void> {
  const purchase = await prisma.purchase.findFirst({
    where: { stripeSessionId: sessionId },
  });

  // Already processed - idempotent return
  if (purchase?.status === 'completed') return;

  // ... existing logic
}
```

### Anti-Patterns to Avoid
- **Double-spending the request body:** `requireCSRFToken()` calls `request.clone().formData()` internally. The `books.$bookId.tsx` action currently does NOT read formData (it's a simple POST with no body beyond CSRF). When adding CSRF, the token must be included in the form.
- **Blocking webhook on slow operations:** The Stripe webhook should return 200 quickly. If any post-processing is slow (like sending emails), do it asynchronously or after the response.
- **Fetching book PDF on every download request:** The current `download.$token.tsx` fetches the PDF from Cloudinary via `fetch()` every time. This is correct (server proxies the download) but could be optimized with streaming if files are large.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSRF protection | Custom token system | `requireCSRFToken()` from `csrf.server.ts` | Already battle-tested in the project; uses crypto.timingSafeEqual |
| Rate limiting | Custom counter | `applyRateLimit()` from `ratelimit.server.ts` | Predefined limits for `download` (20/hr) and `api` (100/min) already configured |
| Webhook signature verification | Manual HMAC | `verifyWebhookSignature()` from `stripe.server.ts` | Uses Stripe SDK's `constructEvent()` which handles clock skew and replay attacks |
| Download token generation | UUID or custom random | `crypto.randomBytes(32).toString('hex')` | Already used; 256-bit entropy is sufficient |
| Price formatting | Manual string formatting | `Intl.NumberFormat` with locale | Already implemented in existing book routes |
| i18n content localization | Manual JSON parsing | `getLocalizedContent()` / `getLocalizedList()` from `i18n.server.ts` | Already handles both string and object translation fields |

**Key insight:** This phase is primarily about hardening and extending existing code. Almost every utility needed already exists in the project.

## Common Pitfalls

### Pitfall 1: Download Count Not Enforced
**What goes wrong:** Users can download purchased books unlimited times despite `maxDownloads: 5` in the schema
**Why it happens:** `verifyDownloadToken()` in `stripe.server.ts` increments `downloadCount` but never checks if it exceeds `maxDownloads`
**How to avoid:** Add `if (purchase.downloadCount >= purchase.maxDownloads) return null;` before incrementing
**Warning signs:** Check the `downloadCount` display on the purchases page -- if numbers exceed 5, the limit isn't enforced

### Pitfall 2: Token Expiration Not Checked
**What goes wrong:** Download tokens work forever, even months after purchase
**Why it happens:** `tokenExpiresAt` field exists in schema but `createCheckoutSession()` never sets it, and `verifyDownloadToken()` never checks it
**How to avoid:** Set `tokenExpiresAt` when creating the purchase (e.g., 30 days from now), and check it in `verifyDownloadToken()`
**Warning signs:** The `tokenExpiresAt` column is always `null` in the Purchase collection

### Pitfall 3: Webhook Idempotency
**What goes wrong:** Stripe may send `checkout.session.completed` multiple times (retries, network issues). Without idempotency, the handler could error trying to update an already-completed purchase.
**Why it happens:** Stripe guarantees at-least-once delivery, not exactly-once
**How to avoid:** Check if purchase is already `completed` before updating. Return early (200) if already processed.
**Warning signs:** Error logs showing "Purchase already completed" or duplicate processing

### Pitfall 4: CSRF Token Missing from Purchase Form
**What goes wrong:** Adding `requireCSRFToken()` to the action breaks the existing purchase form because no `_csrf` hidden input exists
**Why it happens:** The current `books.$bookId.tsx` Form doesn't include a CSRF field
**How to avoid:** When adding CSRF protection, also update the loader to provide the CSRF token and add `<input type="hidden" name="_csrf" value={csrfToken} />` to the form
**Warning signs:** All purchase attempts return 403 after adding CSRF validation

### Pitfall 5: Book isActive Not Checked During Download
**What goes wrong:** If admin deactivates a book, users who previously purchased it can still download
**Why it happens:** `verifyDownloadToken()` fetches the book but doesn't check `isActive`
**How to avoid:** Add `if (!book.isActive) return null;` check. Alternatively, intentionally allow downloads of deactivated books (business decision -- user paid for it). Document whichever choice is made.
**Warning signs:** Deactivated books still downloadable

### Pitfall 6: Missing Error Boundary for Stripe Failures
**What goes wrong:** If Stripe is down or misconfigured, the purchase form shows a generic error or blank page
**Why it happens:** The action catches errors and returns JSON `{ error }` but the component doesn't render error states from actionData
**How to avoid:** Use `useActionData()` in the component to display error messages, and add an ErrorBoundary export
**Warning signs:** Users report "nothing happens" when clicking Buy

## Code Examples

Verified patterns from existing codebase:

### Category Filter UI Component
```typescript
// Pattern derived from existing exercises._index.tsx filter approach
// For books._index.tsx - add category buttons/links
function CategoryFilter({ categories, selected }: { categories: string[]; selected: string | null }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Link
        to="/books"
        className={`px-3 py-1 rounded-full text-sm ${
          !selected ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {t("books.allCategories")}
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat}
          to={`/books?category=${encodeURIComponent(cat)}`}
          className={`px-3 py-1 rounded-full text-sm ${
            selected === cat ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {cat}
        </Link>
      ))}
    </div>
  );
}
```

### CSRF-Protected Purchase Form
```typescript
// Pattern from existing csrf.server.ts usage
// In books.$bookId.tsx loader - add CSRF token
export const loader: LoaderFunction = async ({ request, params }) => {
  // ... existing book loading ...
  const { token: csrfToken, headers: csrfHeaders } = await getCSRFToken(request);
  return data({ book, csrfToken, /* ... */ }, { headers: csrfHeaders });
};

// In component
<Form method="post">
  <input type="hidden" name="_csrf" value={csrfToken} />
  <button type="submit">{t("books.buy")}</button>
</Form>
```

### Download with Limits and Rate Limiting
```typescript
// Pattern from existing ratelimit.server.ts
// In download.$token.tsx loader
export const loader: LoaderFunction = async ({ request, params }) => {
  const { token } = params;
  if (!token) throw new Response('Download token required', { status: 400 });

  // Rate limit downloads
  const rateLimitResponse = applyRateLimit(request, 'download');
  if (rateLimitResponse) return rateLimitResponse;

  const result = await verifyDownloadToken(token);
  if (!result) {
    throw new Response('Invalid, expired, or download limit reached', { status: 403 });
  }

  // ... existing fetch and return logic ...
};
```

### Webhook Idempotency Pattern
```typescript
// In stripe.server.ts handlePaymentSuccess
export async function handlePaymentSuccess(sessionId: string): Promise<void> {
  if (!stripe) throw new Error('Stripe is not configured');

  // Check if already processed (idempotency)
  const existingPurchase = await prisma.purchase.findFirst({
    where: { stripeSessionId: sessionId, status: 'completed' },
  });
  if (existingPurchase) return; // Already fulfilled

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== 'paid') throw new Error('Payment not completed');

  const purchaseId = session.metadata?.purchaseId;
  if (!purchaseId) throw new Error('Purchase ID not found in session metadata');

  // Set token expiration (30 days from now)
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

  await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      status: 'completed',
      stripePaymentId: session.payment_intent as string,
      tokenExpiresAt,
      updatedAt: new Date(),
    },
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stripe Charges API | Stripe Checkout Sessions | Stripe deprecated Charges for new integrations | Project already uses Checkout Sessions correctly |
| `json()` helper from Remix | `data()` helper from Remix | Remix v2 with v3_singleFetch flag | Project already migrated to `data()` in most routes; webhook still uses `json()` which should be updated |
| Remix v1 route convention | Remix v2 flat file routing | Remix v2 | Project uses flat file routing (`books._index.tsx`, `books.$bookId.tsx`) |

**Deprecated/outdated in this codebase:**
- `json()` in `api.stripe-webhook.tsx`: Should be replaced with `data()` since v3_singleFetch is enabled. LOW priority since webhook returns to Stripe, not browser.
- Public Cloudinary URLs for book PDFs: Currently `access_mode: 'public'` in `cloudinary.server.ts`. For paid content, books should ideally be uploaded with `type: 'authenticated'` or at minimum use signed URLs. However, since the download is proxied through the server (not exposing the URL to the client), public URLs are acceptable for now.

## Open Questions

1. **Should deactivated books still be downloadable by previous purchasers?**
   - What we know: `book.isActive` check is missing from `verifyDownloadToken()`. The schema supports checking it.
   - What's unclear: Business intent -- did the user pay for permanent access or conditional access?
   - Recommendation: Allow downloads of deactivated books (user paid for the content). Only block downloads if the book is deleted entirely. Flag for product owner decision.

2. **What download token expiration period is appropriate?**
   - What we know: `tokenExpiresAt` field exists but is never populated. Schema supports it.
   - What's unclear: How long should a purchase remain downloadable?
   - Recommendation: Set 365 days (1 year) expiration. Display remaining downloads and expiration on the purchases page. This is generous enough to not frustrate users while still providing a boundary.

3. **Should the book catalog page show a maximum download count to users?**
   - What we know: `maxDownloads: 5` is the schema default. The purchases page shows download count but not the max.
   - What's unclear: Should the limit be visible to users before or after purchase?
   - Recommendation: Show "X of 5 downloads remaining" on the purchases page. Don't show the limit on the catalog page (it might discourage purchases).

4. **What categories should books use?**
   - What we know: Books have a `category` string field. Exercises use Greek math categories (Algebra, Geometry, etc.) from `services/models/models.ts`. Books may use different categories.
   - What's unclear: Whether book categories should match exercise categories or be independent.
   - Recommendation: Use the same category values as exercises for consistency. The category filter should be dynamic (query distinct categories from the database) rather than hardcoded, so it adapts to whatever categories the admin uses.

## Sources

### Primary (HIGH confidence)
- Existing codebase files (direct source code inspection):
  - `app/utils/stripe.server.ts` -- full Stripe integration already implemented
  - `app/routes/books._index.tsx`, `books.$bookId.tsx` -- existing book routes
  - `app/routes/api.stripe-webhook.tsx` -- webhook handler
  - `app/routes/download.$token.tsx` -- download route
  - `app/routes/purchases.tsx` -- purchase history
  - `prisma/schema.prisma` -- Book and Purchase models
  - `.planning/codebase/CONCERNS.md` -- documented bugs and fragile areas
- [Stripe Checkout Sessions API docs](https://docs.stripe.com/api/checkout/sessions)
- [Stripe webhook fulfillment best practices](https://docs.stripe.com/checkout/fulfillment)
- [Stripe webhook signature verification](https://docs.stripe.com/webhooks/signature)

### Secondary (MEDIUM confidence)
- [Remix Discussion #1978: Raw body for Stripe webhooks](https://github.com/remix-run/remix/discussions/1978) -- confirms `request.text()` works for raw body in Remix
- [Cloudinary access control documentation](https://cloudinary.com/documentation/control_access_to_media) -- authenticated vs public access modes
- [Cloudinary signed URL documentation](https://cloudinary.com/documentation/delivery_url_signatures) -- signed URL generation

### Tertiary (LOW confidence)
- None -- all findings verified through codebase inspection or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in the project; no new dependencies
- Architecture: HIGH -- all routes and patterns already exist in the codebase; this phase extends/fixes them
- Pitfalls: HIGH -- documented in project's own `.planning/codebase/CONCERNS.md` and verified via code inspection
- Download security: MEDIUM -- token expiration and download limits are straightforward to implement, but the business rules (expiration period, deactivated book access) need product owner input

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable domain, no rapidly changing dependencies)
