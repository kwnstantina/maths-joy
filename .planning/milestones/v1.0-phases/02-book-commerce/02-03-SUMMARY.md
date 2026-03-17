---
phase: 02-book-commerce
plan: 03
subsystem: payments, security
tags: [stripe, prisma, rate-limiting, i18n, remix, idempotency]

# Dependency graph
requires:
  - phase: 02-book-commerce
    provides: Stripe checkout session, purchase model, webhook handler, download route, purchases page
provides:
  - Idempotent webhook handler that skips already-completed purchases
  - Token expiration (365 days) set on successful payment
  - Download enforcement with count limit, token expiry, and book active status checks
  - Rate-limited download route (20/hr per IP)
  - Purchases page showing remaining downloads and hiding button when exhausted
affects: [download-flow, purchases-page, stripe-webhook]

# Tech tracking
tech-stack:
  added: []
  patterns: [idempotent webhook processing, download enforcement chain (count/expiry/active), rate limiting on unauthenticated routes]

key-files:
  created: []
  modified:
    - app/utils/stripe.server.ts
    - app/routes/api.stripe-webhook.tsx
    - app/routes/download.$token.tsx
    - app/routes/purchases.tsx
    - public/locales/en/common.json
    - public/locales/el/common.json

key-decisions:
  - "Download enforcement order: purchase status -> count limit -> token expiry -> book exists/active -> increment count"
  - "Rate limiting on download route uses IP-based identification since downloads are unauthenticated (token-based)"
  - "Webhook idempotency check queries by stripeSessionId+completed status before calling Stripe API"

patterns-established:
  - "Idempotency pattern: check DB before external API call to avoid unnecessary network requests"
  - "Download enforcement chain: all checks before any side effects (increment)"

requirements-completed: [BOOK-04, BOOK-05]

# Metrics
duration: 6min
completed: 2026-03-14
---

# Phase 02 Plan 03: Webhook Idempotency and Download Enforcement Summary

**Idempotent Stripe webhook with 365-day token expiration, download count/expiry/active enforcement, and rate-limited download route**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T13:50:02Z
- **Completed:** 2026-03-14T13:55:40Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Webhook handler is now idempotent -- returns early if purchase already completed, avoiding unnecessary Stripe API calls
- Successful payments set tokenExpiresAt to 365 days, enabling time-limited downloads
- verifyDownloadToken enforces download count limit, token expiration, and book.isActive before incrementing count
- Download route rate-limited at 20/hr per IP to prevent abuse
- Purchases page shows "X of 5 downloads remaining" and hides download button when exhausted
- Webhook route migrated from deprecated json() to data() for v3_singleFetch compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Add idempotency and token expiration to webhook handler** - `0d3e874` (feat)
2. **Task 2: Add rate limiting to download route and show remaining downloads** - `57a4707` (feat)

## Files Created/Modified
- `app/utils/stripe.server.ts` - Idempotent handlePaymentSuccess with tokenExpiresAt; hardened verifyDownloadToken with count/expiry/active checks
- `app/routes/api.stripe-webhook.tsx` - Migrated from json() to data() for v3_singleFetch
- `app/routes/download.$token.tsx` - Added rate limiting (20/hr per IP) and descriptive error message
- `app/routes/purchases.tsx` - Added maxDownloads/tokenExpiresAt to interface, conditional download button with remaining count
- `public/locales/en/common.json` - Added purchases.downloadsRemaining and purchases.downloadLimitReached keys
- `public/locales/el/common.json` - Added Greek translations for download limit messages

## Decisions Made
- Download enforcement order: purchase status -> count limit -> token expiry -> book exists/active -> increment count (all checks before side effects)
- Rate limiting on download route uses IP identification since route is unauthenticated (token-based access)
- Webhook idempotency queries DB by stripeSessionId+completed before calling Stripe API to avoid unnecessary external calls

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Stripe and Cloudinary must already be configured from prior plans.

## Next Phase Readiness
- Phase 02 (Book Commerce) is now complete with all 3 plans executed
- Full purchase-to-download pipeline is secured: checkout -> webhook (idempotent) -> download (rate-limited, enforcement chain)
- Ready for Phase 03

## Self-Check: PASSED

All 6 files verified on disk. All 2 task commits verified in git log.

---
*Phase: 02-book-commerce*
*Completed: 2026-03-14*
