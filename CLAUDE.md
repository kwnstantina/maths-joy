# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm run start            # Start production server (remix-serve)
npm run typecheck        # TypeScript type checking (tsc --noEmit)
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run prisma:generate  # Regenerate Prisma client (run after schema changes)
npm run prisma:push      # Push schema to MongoDB
npm run prisma:studio    # Prisma Studio GUI
npm run prisma:seed      # Seed database (npx tsx prisma/seed.ts)
```

## Architecture

**Remix 2 + Vite** full-stack app. React 18, TypeScript, Tailwind CSS, MongoDB via Prisma, deployed on Vercel.

### Route conventions

Flat file routing in `app/routes/`. Period-separated segments map to URL paths (e.g., `books.$bookId.tsx` → `/books/:bookId`). Remix v3 future flags are enabled in `vite.config.ts` (`v3_singleFetch`, `v3_fetcherPersist`, etc.).

### Path alias

`~/*` maps to `./app/*` (configured in `tsconfig.json` paths). Use `~/utils/...` for app-internal imports.

### Server vs client code

Files with `.server.ts` suffix are server-only (tree-shaken from client bundle). Key server modules in `app/utils/`:
- `prisma.server.ts` — Singleton Prisma client
- `auth.prisma.ts` — Session auth (bcrypt) + Google OAuth (remix-auth)
- `stripe.server.ts` — Checkout sessions, webhook verification, download tokens
- `cloudinary.server.ts` — File upload/delete/signed URLs
- `csrf.server.ts` — CSRF token generation and timing-safe validation
- `ratelimit.server.ts` — In-memory rate limiting per action type
- `audit.server.ts` — Security event logging
- `validators.server.ts` — Input validation (email, password, files, redirect URLs)
- `i18n.server.ts` — Localization helpers for content with `translation` JSON fields

Data access modules (`*.prisma.ts` files) handle CRUD for each domain: `exersices.prisma.ts`, `training.prisma.ts`, `books.prisma.ts`, `video.prisma.ts`, `qa.server.ts`.

### Components

Reusable components live in `/components/` (outside `app/`), organized by feature: `navs/`, `footer/`, `uploadExTabs/`, `chat/`, `video/`, `training/`, `alerts/`, `modal/`, `card/`, etc. Custom hooks in `/hooks/`. Shared services in `/services/` (cookies, internal utilities).

### Internationalization (i18n)

- Two languages: Greek (`el`, default/fallback) and English (`en`)
- Translation files: `public/locales/{el,en}/common.json`
- Server: `remix-i18next` + `i18next-fs-backend`. Client: `i18next-http-backend` + `LanguageDetector`
- Language stored in cookie (`i18nCookie` in `services/cookies/cookies.ts`)
- DB content uses a `translation` JSON field on models (Exersice, Book, Training, Video) — use `getLocalizedContent()` / `getLocalizedList()` from `i18n.server.ts`
- Routes declare namespaces via `export const handle = { i18n: ["common"] }`

### Authentication

Two flows: email/password (bcrypt, session cookie named `"gregMaths"`, 30-day expiry) and Google OAuth (`remix-auth` with `GoogleStrategy`). Session helpers: `requireUserId()`, `getUserId()`, `getUser()`. On login, users sync to Supabase for chat via `chatAuthorization()`.

### Security patterns

- CSRF: Separate session storage, crypto-random tokens, timing-safe comparison. Forms include `<input name="_csrf">`, validated via `requireCSRFToken()`
- Rate limiting: In-memory store with predefined limits (upload: 5/hr, download: 20/hr, api: 100/min, auth: 10/15min, contact: 3/hr)
- Security headers set in `entry.server.tsx` (X-Frame-Options, HSTS in prod, etc.)
- Audit logging to MongoDB `AuditLog` model

### Database (Prisma + MongoDB)

Key models: `User`, `Exersice` (note: misspelled in schema), `Book`, `Purchase`, `Training`, `Video`, `Question`, `Answer`, `QuestionVote`, `AnswerVote`, `UserProgress`, `AuditLog`. Schema at `prisma/schema.prisma`.

### External services

- **MongoDB Atlas** — Primary database (`DATABASE_URL`)
- **Supabase** — Real-time chat (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- **Cloudinary** — File/image storage
- **Stripe** — Payments, webhook at `/api/stripe-webhook`
- **Google OAuth** — Social login

### Tailwind

Config in `tailwind.config.cjs`. Content scans both `./app/**` and `./components/**`. Custom `xs: 300px` breakpoint. Custom animations: `wiggle`, `gradient`, `text`. Custom `.scrollbar-hide` utility.

### ESLint

Import ordering enforced: `builtin → external → internal → parent → sibling → index` (no newlines between groups, alphabetical). Unused vars with `_` prefix are allowed. `no-explicit-any` is a warning.

### Roles

`app/utils/roles.ts` provides `isAdmin()` and `hasRole()` (case-insensitive checks against `user.role`).
