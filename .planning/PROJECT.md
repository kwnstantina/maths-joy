# GregKyrMaths

## What This Is

A mathematics educational platform where a teacher (Greg) publishes exercises, video tutorials, and textbooks for students. Students can browse free exercises, purchase and download math textbooks via Stripe, watch YouTube video tutorials, and participate in a community Q&A system. Available in Greek (primary) and English.

## Core Value

Students can find, practice, and learn mathematics through exercises, videos, and books — with the teacher as the sole content creator and the Q&A community helping each other.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase. -->

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

### Active

<!-- Current scope. Building toward these. -->

- [ ] Book e-commerce: upload books with thumbnails, pricing, Stripe checkout, download after purchase
- [ ] Stripe payment flow: checkout sessions, webhook handling, purchase records, download tokens
- [ ] Q&A system: ask questions, answer, vote (up/down), accept answers — Stack Overflow style
- [ ] Video tutorials: upload/manage YouTube video links with categories and tags
- [ ] Bulk exercise upload: batch upload multiple PDFs at once instead of one-by-one
- [ ] Book upload flow: admin can upload book PDFs with metadata, thumbnails, pricing
- [ ] Tutorial upload flow: admin can upload/manage tutorial content
- [ ] Full Greek/English translations for all new features
- [ ] User progress tracking across exercises and content
- [ ] Purchase history page for students

### Out of Scope

<!-- Explicit boundaries. -->

- Multiple teacher accounts — single teacher (Greg) creates all content
- Real-time notifications — not needed for v1
- Mobile app — web-first platform
- Payment methods beyond Stripe — Stripe covers Greek/EU cards
- Video hosting — videos stay on YouTube, platform embeds them

## Context

- **Brownfield project**: Significant codebase already exists with Remix 2, Prisma/MongoDB, Tailwind CSS
- **Partial implementations**: Book model and Stripe utilities exist but the full purchase flow is incomplete
- **Q&A models exist**: Question, Answer, Vote models are in the Prisma schema but routes need completion
- **Upload dashboard**: `uploadEx.tsx` handles exercise and training uploads; book and tutorial upload tabs are new (untracked files)
- **Greek-first**: Default language is Greek (`el`), English is secondary. Translation JSON fields on DB models
- **Deployed on Vercel**: Production deployment with Vercel analytics

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
| Free exercises, paid books | Exercises drive traffic, books generate revenue | — Pending |
| Stack Overflow-style Q&A | Open community where anyone asks and answers, voting determines quality | — Pending |
| YouTube for video hosting | No need to host videos, embed YouTube links | — Pending |
| Bulk upload for exercises | One-by-one is too slow for the teacher | — Pending |
| Greek as primary language | Target audience is Greek math students | — Pending |

---
*Last updated: 2026-02-21 after initialization*
