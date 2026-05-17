# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Book Platform

**Shipped:** 2026-03-17
**Phases:** 2 | **Plans:** 5 | **Tasks:** 12

### What Was Built
- Admin book management with streaming Cloudinary upload, soft delete, PDF archive, inline editing
- Student book catalog with category filtering and Stripe checkout (EU VAT, CSRF, rate limiting, audit)
- Checkout success page with backend Stripe API verification and useRevalidator webhook polling
- Idempotent webhook handler with download enforcement (count limit, token expiry, rate limiting)
- Full Greek/English translations for all book-related UI

### What Worked
- Plan execution was fast and consistent — average 7min per plan, improving over time (10min → 4.3min)
- Research-first approach prevented duplication with existing codebase (Book model, Stripe utils already existed)
- Security-by-default pattern (CSRF → auth → rate limit → audit → business logic) applied consistently
- Atomic task commits made progress easy to track and rollback if needed

### What Was Inefficient
- Phase 2 plans were discovered to need existing codebase patterns — earlier audit of existing code could have saved planning time
- Download count increment on URL generation (not click) is a known approximation — acceptable but noted

### Patterns Established
- Streaming Cloudinary upload for large files (uploadStreamToCloudinary)
- Admin multi-action handler (_action discriminator) for CRUD in single route
- Inline card editing via useFetcher for seamless UX
- Purchase security chain: CSRF → auth → rate limit → audit → business logic
- Idempotent webhook: DB check before external API call
- Download enforcement chain: status → count → expiry → active → increment (all checks before side effects)
- IP-based rate limiting for unauthenticated routes

### Key Lessons
1. Research phase that audits existing code prevents building duplicate functionality
2. Security patterns should be established early — they compound across features
3. Brownfield projects benefit from data access layer decoupling (books.prisma.ts pattern)
4. useRevalidator is better than useFetcher for polling scenarios that need full loader re-runs

### Cost Observations
- Total execution time: 33min across 5 plans
- Trend: Improving (Phase 2 averaged 4.3min vs Phase 1 at 10min)
- Notable: Plans with existing patterns to follow executed 2x faster

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Avg/Plan | Key Change |
|-----------|--------|-------|----------|------------|
| v1.0 | 2 | 5 | 7min | Established research-first, atomic commits |

### Top Lessons (Verified Across Milestones)

1. Research existing codebase before planning — prevents duplication and speeds execution
2. Security patterns compound: invest early, apply consistently
