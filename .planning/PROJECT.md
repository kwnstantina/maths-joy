# GregKyrMaths

## What This Is

A mathematics educational platform where a teacher (Greg) publishes exercises, video tutorials, and textbooks for students. Students can browse free exercises, purchase and download math textbooks via Stripe with EU VAT compliance, watch YouTube video tutorials, and participate in a community Q&A system. Available in Greek (primary) and English.

## Core Value

Students can find, practice, and learn mathematics through exercises, videos, and books — with the teacher as the sole content creator and the Q&A community helping each other.

## Requirements

### Validated

- ✓ User authentication (email/password + Google OAuth) — existing
- ✓ Session management with cookie-based sessions — existing
- ✓ Exercise upload to Cloudinary with categories and search — existing
- ✓ PDF viewer for exercises — existing
- ✓ Video/tutorial content management — existing
- ✓ Training exercises with content and solutions — existing
- ✓ Real-time chat via Supabase — existing
- ✓ i18n infrastructure (Greek/English) with remix-i18next — existing
- ✓ Landing page with hero, intro, newsletter — existing
- ✓ Admin upload dashboard (exercises, training) — existing
- ✓ CSRF protection, rate limiting, audit logging — existing
- ✓ Security headers (X-Frame-Options, HSTS, etc.) — existing
- ✓ Cloudinary integration for file storage — existing
- ✓ User roles and admin detection — existing
- ✓ Contact form with CSRF + rate limiting — existing
- ✓ Admin book upload with streaming Cloudinary, soft delete, PDF archive — v1.0
- ✓ Book catalog with category filtering — v1.0
- ✓ Stripe checkout with CSRF, rate limiting, audit, EU VAT tax — v1.0
- ✓ Idempotent webhook with purchase records and download tokens — v1.0
- ✓ Download enforcement (count limit, token expiry, rate limiting) — v1.0

- ✓ Q&A with voting, accepted answers, search and filters — v1.1
- ✓ Video tutorials (YouTube links, categories, public listing) — v1.1
- ✓ Bulk exercise upload, exercise search, server-side pagination — v1.1
- ✓ Full Greek/English translations for v1.1 features — v1.1
- ✓ Greg AI tutor: daily message/spend cap, 👍/👎, photo input, page-aware hints, hint ladder — v1.2
- ✓ Greg AI exercise/video search, personalization, practice mode, teacher dashboard — v1.2
- ✓ Privacy policy discloses Greg AI, Anthropic/Resend processors and teacher chat review — v1.2
- ✓ Vercel Analytics (cookie-less page views) — v1.2

### Active

- [ ] To be defined for v1.3 (candidates: Greg AI credit packs, bring books back, more transcribed booklets, tests for money/limit paths, model tiering & prompt caching)

### Out of Scope

- Multiple teacher accounts — single teacher (Greg) creates all content
- Real-time notifications — not needed for v1
- Mobile app — web-first platform
- Payment methods beyond Stripe — Stripe covers Greek/EU cards
- Video hosting — videos stay on YouTube, platform embeds them

## Current Milestone

None — v1.2 Greg AI Enhancement shipped 2026-10-25. v1.3 not yet defined.

## Context

Shipped v1.0 with complete book e-commerce pipeline. 47 files changed (+6,394 / -605).
Tech stack: Remix 2 + Vite, React 18, Prisma/MongoDB, Tailwind CSS, Stripe, Cloudinary.
Deployed on Vercel. Greek-first with English secondary.

Key patterns established in v1.0:
- Streaming Cloudinary upload for large files
- Admin multi-action handler (_action discriminator)
- Purchase security chain: CSRF → auth → rate limit → audit → business logic
- Idempotent webhook processing (DB check before Stripe API call)
- Download enforcement chain with count/expiry/active checks

## Constraints

- **Tech stack**: Remix 2 + Vite, React 18, Prisma/MongoDB, Tailwind CSS — all established, no changes
- **File storage**: Cloudinary for all file uploads (PDFs, images, thumbnails)
- **Payments**: Stripe only — webhook at `/api/stripe-webhook`
- **Database**: MongoDB via Prisma — no migrations, uses `prisma db push`
- **i18n**: Greek (el) default, English (en) secondary — `translation` JSON field pattern on models
- **Auth**: Session-based + Google OAuth via remix-auth — no changes to auth flow

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Free exercises, paid books | Exercises drive traffic, books generate revenue | ✓ Good — v1.0 shipped |
| Stack Overflow-style Q&A | Open community where anyone asks and answers, voting determines quality | ✓ Shipped — v1.1 |
| YouTube for video hosting | No need to host videos, embed YouTube links | ✓ Shipped — v1.1 |
| Bulk upload for exercises | One-by-one is too slow for the teacher | ✓ Shipped — v1.1 |
| Greek as primary language | Target audience is Greek math students | ✓ Good |
| Streaming Cloudinary upload | Handles large PDFs without memory issues | ✓ Good — v1.0 |
| Multi-action handler pattern | Single route handles CRUD via _action discriminator | ✓ Good — v1.0 |
| Public Cloudinary URLs for books | Books use public access_mode, no signed URLs needed | ✓ Good — v1.0 |
| Idempotent webhooks | DB check before Stripe API avoids unnecessary external calls | ✓ Good — v1.0 |
| IP-based rate limiting on downloads | Download route is unauthenticated (token-based) | ✓ Good — v1.0 |
| Greg AI on Haiku 4.5 with daily cap | Cheap default model; Mongo-persisted cap bounds the bill | ✓ Good — v1.2 |
| Photos never stored | Sent once, transcribed into the reply — no image storage, no token compounding | ✓ Good — v1.2 |
| Zero-token buttons / reply markers over tools | Every tool adds tokens to every request | ✓ Good — v1.2 |

---
*Last updated: 2026-10-25 after v1.2 milestone*
