# External Integrations

**Analysis Date:** 2026-02-21

## APIs & External Services

**Payment Processing:**
- Stripe (v17.4.0) - Payment processing and checkout
  - SDK/Client: `stripe` npm package
  - Auth: `STRIPE_SECRET_KEY` (secret key), `STRIPE_WEBHOOK_SECRET` (for webhooks)
  - Implementation: `app/utils/stripe.server.ts`
  - API Version: 2025-02-24.acacia
  - Functions: Create checkout sessions, handle payment success/failure, verify download tokens, manage user purchases
  - Webhooks: Listens to `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed` events at `/api/stripe-webhook`

**Cloud File Storage:**
- Cloudinary (v2.5.1) - Media storage and CDN for PDFs and images
  - SDK/Client: `cloudinary` npm package (`v2` API)
  - Auth: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - Implementation: `app/utils/cloudinary.server.ts`
  - Functions: Upload files from Base64, upload from buffer, delete files, generate signed URLs, get public URLs, image transformations (thumbnails)
  - Folders: `maths-joy/exercises` (PDFs), `maths-joy/thumbnails` (images)
  - Resource types: raw (PDFs), image, video

**Authentication & Identity:**
- Google OAuth 2.0 - Sign-in via Google
  - SDK/Client: `remix-auth-google` (v2.0.0)
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - Implementation: `app/utils/auth.prisma.ts` (GoogleStrategy configuration)
  - Strategy: Uses remix-auth Authenticator with Google strategy
  - Callback URL: Default is `http://localhost:3000/auth/callback`
  - User data: Syncs Google profile (name, email, profile picture) to local database

- Custom Authentication - Email/password auth
  - Method: bcryptjs password hashing
  - Session storage: Cookie-based session (secure, httpOnly, SameSite=lax)
  - Session duration: 30 days
  - Implementation: `app/utils/auth.prisma.ts`

## Data Storage

**Databases:**
- MongoDB (via Prisma)
  - Connection: `DATABASE_URL` environment variable
  - Client: Prisma ORM (`@prisma/client` v5.22.0)
  - Schema: `prisma/schema.prisma`
  - Models: User, Exersice, Book, Purchase, Training, Video, Question, Answer, QuestionVote, AnswerVote, UserProgress, AuditLog

- Supabase PostgreSQL
  - Connection: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` (v2.47.10)
  - Implementation: `utils/supabase.ts`
  - Usage: Real-time chat, user presence tracking, Q&A system integration
  - Tables: users (with provider_id, email, profile data, active status)

**File Storage:**
- Cloudinary (cloud storage)
- Local filesystem: Not used for primary storage

**Caching:**
- None configured - In-memory rate limiting only (for request throttling, not data caching)

## Authentication & Identity

**Auth Provider:**
- Custom system with Google OAuth fallback
  - Primary: Email/password with bcryptjs hashing
  - Secondary: Google OAuth 2.0 via remix-auth
  - Session management: Cookie-based with Remix session storage
  - User status tracking: `isActive` field synced to Supabase users table

**Auth Flow:**
1. Local registration/login via `app/utils/auth.prisma.ts`
2. Google OAuth via remix-auth-google strategy
3. User data synced to MongoDB (primary) and Supabase PostgreSQL (chat/presence)
4. Session token stored in secure cookie

## Monitoring & Observability

**Analytics:**
- Vercel Analytics (v1.4.1) - Performance monitoring
  - No explicit configuration needed - integrated via `@vercel/analytics` package
  - Automatically tracked if deployed on Vercel

**Error Tracking:**
- No dedicated service detected
- Console error logging used throughout application

**Logs:**
- Console logging (console.log, console.error, console.warn)
- Audit logging: `app/utils/audit.server.ts` records user actions to MongoDB AuditLog table
  - Tracked actions: upload, download, purchase, login, logout
  - Tracked resources: exercise, book, training, user, question, answer
  - Captures: IP address, user agent, action metadata

## CI/CD & Deployment

**Hosting:**
- Designed for Node.js-compatible platforms (Vercel, Netlify, etc.)
- Build output: `./build/server/index.js` (via `npm run build`)

**Build Process:**
- Build: `remix vite:build` - Vite + Remix compiler
- Serve: `remix-serve ./build/server/index.js`
- Start command: `npm run start`

**Development:**
- Dev server: `remix vite:dev` (runs on port 3000)
- Type checking: `npm run typecheck` (tsc)
- Linting: `npm run lint` (ESLint with cache)

## Database Migrations

**Prisma:**
- Migration command: `npm run prisma:push` (push schema to database)
- Schema generation: `npm run prisma:generate` (regenerate Prisma client)
- Schema file: `prisma/schema.prisma`
- Seed data: `npm run prisma:seed` (runs `prisma/seed.ts`)
- Studio (visual editor): `npm run prisma:studio`

## Security Features

**CSRF Protection:**
- Custom CSRF token implementation: `app/utils/csrf.server.ts`
- Token generation: 32-byte random hex strings
- Storage: Separate CSRF cookie session (httpOnly, secure)
- Validation: Timing-safe comparison to prevent timing attacks
- Token lifetime: 24 hours
- Implementation details:
  - `getCSRFToken(request)` - Get or create token
  - `validateCSRFToken(request, token)` - Validate submission
  - `requireCSRFToken(request)` - Enforce in actions

**Rate Limiting:**
- In-memory rate limiter: `app/utils/ratelimit.server.ts`
- Predefined limits:
  - Upload: 5 per hour
  - Download: 20 per hour
  - API: 100 per minute
  - Auth: 10 per 15 minutes
  - Contact form: 3 per hour
- Identifier: IP address or user ID
- Auto-cleanup: Old entries removed every 5 minutes
- Response headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After

**Audit Logging:**
- `app/utils/audit.server.ts` - Security event tracking
- Logs to MongoDB AuditLog table
- Captures: user ID, action type, resource type, IP address, user agent, metadata
- Non-blocking: Errors don't break main flow

**Input Security:**
- XSS prevention: `xss` package (v1.0.15) for HTML sanitization

## Webhooks & Callbacks

**Incoming:**
- Stripe webhooks: `/api/stripe-webhook`
  - Endpoint: `app/routes/api.stripe-webhook.tsx`
  - Signature verification: STRIPE_WEBHOOK_SECRET
  - Handled events: checkout.session.completed, checkout.session.expired, payment_intent.payment_failed

**Outgoing:**
- Stripe checkout redirect URLs (success/cancel)
  - Success URL: Includes session_id and download token as query params
  - Cancel URL: Configurable per request

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - MongoDB connection string
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `CLOUDINARY_CLOUD_NAME` - Cloudinary account name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_CALLBACK_URL` - Google OAuth callback URL
- `SESSION_SECRET` - Session cookie encryption secret (also used for CSRF)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `NODE_ENV` - Environment (development/production)

**Secrets location:**
- `.env` file (development)
- Environment variables (production via hosting platform)
- Never committed to git (`.env` in .gitignore)

## Internationalization

**Translation System:**
- i18next (v23.16.8) - Translation framework
- Backend: i18next-fs-backend (server), i18next-http-backend (client)
- Language detection: i18next-browser-languagedetector
- Remix integration: remix-i18next (v6.4.1)
- Translation files: `public/locales/{language}/common.json`
- Supported languages: English (en), Greek (el)

---

*Integration audit: 2026-02-21*
