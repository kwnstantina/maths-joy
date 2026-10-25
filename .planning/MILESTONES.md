# Milestones

## v1.2 Greg AI Enhancement (Shipped: 2026-10-25)

**Phases:** 8-14 | **Plans:** 3 (Phase 8 only; 9-14 built outside GSD)
**Timeline:** 2026-08-28 → 2026-10-24
**Git range:** `3f5b02b` → `2bbfed1` | **Files:** 80 changed (+8,654 / -2,390)

**Delivered:** Greg AI went from a generic chat bubble to a cost-bounded tutor that knows the page, reads photos, finds the site's own exercises and videos, runs a practice mode, and reports to the teacher.

**Key accomplishments:**
1. Daily message + spend cap persisted in Mongo; 👍/👎 on every answer
2. Photo input (shrunk in the browser, never stored) and one-off transcription of booklets and "test yourself" problems
3. Page-aware tutoring with official solutions used to aim hints, plus a zero-token hint ladder
4. Exercise/video search tool, contact card to reach the real teacher, contact-form email via Resend
5. Personalization (grade, recent struggles), practice mode with answer checking, `/admin/greg-ai` dashboard

**Requirements completed:** GREGAI-01…09 (9/11). Deferred: GREGAI-10 model tiering, GREGAI-11 prompt caching.

**Archive:** [v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md) | [v1.2-REQUIREMENTS.md](milestones/v1.2-REQUIREMENTS.md)

---

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

