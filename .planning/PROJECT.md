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

### Active

- [ ] Q&A system: ask questions, answer, vote (up/down), accept answers — Stack Overflow style
- [ ] Q&A search and filtering by category, tags, text
- [ ] Video tutorials: upload/manage YouTube video links with categories and tags
- [ ] Bulk exercise upload: batch upload multiple PDFs at once
- [ ] Improved exercise search by title, category, or tags
- [ ] Full Greek/English translations for all new features

### Out of Scope

- Multiple teacher accounts — single teacher (Greg) creates all content
- Real-time notifications — not needed for v1
- Mobile app — web-first platform
- Payment methods beyond Stripe — Stripe covers Greek/EU cards
- Video hosting — videos stay on YouTube, platform embeds them

## Current Milestone: v1.1 Platform Completion

**Goal:** Complete the remaining platform capabilities — Q&A community, video management, exercise improvements, and full i18n.

**Target features:**
- Q&A system with questions, answers, voting, and search/filtering
- Admin video management (YouTube links with metadata)
- Bulk exercise upload and improved search
- Full Greek/English translations for all new features

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
| Stack Overflow-style Q&A | Open community where anyone asks and answers, voting determines quality | — Pending |
| YouTube for video hosting | No need to host videos, embed YouTube links | — Pending |
| Bulk upload for exercises | One-by-one is too slow for the teacher | — Pending |
| Greek as primary language | Target audience is Greek math students | ✓ Good |
| Streaming Cloudinary upload | Handles large PDFs without memory issues | ✓ Good — v1.0 |
| Multi-action handler pattern | Single route handles CRUD via _action discriminator | ✓ Good — v1.0 |
| Public Cloudinary URLs for books | Books use public access_mode, no signed URLs needed | ✓ Good — v1.0 |
| Idempotent webhooks | DB check before Stripe API avoids unnecessary external calls | ✓ Good — v1.0 |
| IP-based rate limiting on downloads | Download route is unauthenticated (token-based) | ✓ Good — v1.0 |

---
*Last updated: 2026-03-17 after v1.1 milestone start*
