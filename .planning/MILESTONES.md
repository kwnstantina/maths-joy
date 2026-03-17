# Milestones

## v1.0 Book Platform (Shipped: 2026-03-17)

**Phases:** 1-2 | **Plans:** 5 | **Tasks:** 12
**Timeline:** 19 days (2026-02-24 → 2026-03-14)
**Git range:** `81cd8f0` → `21e8aa1` | **Files:** 47 changed (+6,394 / -605)

**Delivered:** Complete book e-commerce pipeline — admin uploads books with metadata, students browse/filter catalog, purchase via Stripe with EU VAT, and download with count/expiry enforcement.

**Key accomplishments:**
1. Extended Book model with streaming Cloudinary upload, soft delete, and PDF archive-on-replace
2. Admin book management page with inline editing, active/inactive toggle, and Greek/English i18n
3. Category-filtered book catalog with CSRF-protected, rate-limited, audit-logged Stripe checkout
4. Checkout success page with backend Stripe API verification and useRevalidator webhook polling
5. Idempotent webhook handler with download count limit, token expiry, and IP-based rate limiting

**Requirements completed:** BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05 (5/5)

**Archive:** [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) | [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)

---

