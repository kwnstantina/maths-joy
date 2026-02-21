# Architecture

**Analysis Date:** 2026-02-21

## Pattern Overview

**Overall:** Fullstack Remix SSR Application with Layered Service Architecture

**Key Characteristics:**
- Server-side rendering (SSR) via Remix with React 18
- Layered separation: routes → components → services → utilities
- Prisma ORM for MongoDB data persistence
- Supabase for real-time chat functionality
- Stripe integration for e-commerce payments
- Authentication via session storage + Google OAuth
- Multi-language i18n support (Greek/English)

## Layers

**Route Layer:**
- Purpose: Entry points for HTTP requests, implements Remix file-based routing
- Location: `app/routes/`
- Contains: Page components with loader/action functions, form handling
- Depends on: Components, services (auth, utilities), validators
- Used by: Remix router, browser requests
- Key patterns: loader functions for data fetching, action functions for mutations, error boundaries

**Component Layer:**
- Purpose: Reusable React UI components, presentational logic only
- Location: `components/`
- Contains: Feature components (chat, exercises, videos), UI primitives (input, modal, card, alerts)
- Depends on: Hooks, react-i18next for translations
- Used by: Route components, other components
- Structure: Feature-based organization with related components in subdirectories

**Utilities & Services Layer:**
- Purpose: Business logic, database access, external integrations
- Location: `app/utils/` (server-side), `services/`, `utils/` (shared)
- Contains:
  - `app/utils/*.prisma.ts`: Database queries (exercises, books, training, video, Q&A)
  - `app/utils/*.server.ts`: Server-only utilities (auth, cloudinary, stripe, CSRF, rate limit)
  - `services/models/models.ts`: Data models and constants
  - `services/cookies/cookies.ts`: Cookie configuration
  - `utils/supabase.ts`: Supabase client singleton
- Depends on: Prisma client, external SDKs (Stripe, Cloudinary, Supabase)
- Used by: Routes, other utilities

**Server Entry Points:**
- Purpose: Application initialization, middleware, SSR setup
- Location: `app/entry.server.tsx`, `app/entry.client.tsx`, `app/root.tsx`
- Contains: I18n initialization, security headers, session handling, global layout
- Depends on: i18next, session storage
- Used by: Remix runtime

## Data Flow

**Page Request Flow:**

1. Browser requests route (e.g., `/exercises`)
2. Remix router matches `app/routes/exercises._index.tsx`
3. Loader function executes on server:
   - Validates user session (auth.prisma.ts)
   - Fetches data from database via Prisma queries (exersices.prisma.ts, etc.)
   - Returns data to component via `useLoaderData()`
4. Component renders with server data
5. Client-side React hydration enables interactivity

**Form Submission Flow:**

1. User submits form with `<Form method="post">`
2. Remix action function receives FormData
3. Validate input via validators.server.ts
4. Call service function (auth.prisma.ts, exersices.prisma.ts, etc.)
5. Return result or redirect response
6. Client automatically refetches loader or shows error

**Real-time Chat Flow:**

1. User loads `/chat` → loader fetches messages/users from Supabase
2. `chatAuthorization()` syncs user from Prisma → Supabase
3. Form submission sends message via action
4. Action inserts to Supabase, returns updated messages
5. Client renders updated chat with real-time user presence

**E-commerce Flow:**

1. User browses books → loader fetches from `prisma.book`
2. User purchases → action creates Stripe session via `stripe.server.ts`
3. Stripe webhook at `/api/stripe-webhook` creates Purchase record
4. Download token generated, user can access `/download/:token`

**State Management:**
- Server-side: Prisma + Supabase as source of truth
- Client-side: React component state for UI-only state
- Session: Cookie-based session storage in `auth.prisma.ts`
- Persistence: MongoDB via Prisma, Supabase PostgreSQL for chat

## Key Abstractions

**Prisma Client Singleton:**
- Purpose: Single database connection instance, reused across requests
- Files: `app/utils/prisma.server.ts`
- Pattern: Global variable with conditional initialization (dev vs prod)
- Exported as: `prisma` - used by all database utility functions

**Authentication Adapter:**
- Purpose: Session management and Google OAuth integration
- Files: `app/utils/auth.prisma.ts`
- Pattern: remix-auth with GoogleStrategy for OAuth, cookie session storage
- Key functions: `getUser()`, `requireUserId()`, `createUserSession()`, `login()`, `register()`
- Session stores: userId in encrypted cookie with 30-day expiration

**Database Query Utilities:**
- Purpose: Encapsulate all Prisma queries for each domain
- Files:
  - `app/utils/exersices.prisma.ts`: Exercise search, filters, CRUD
  - `app/utils/books.prisma.ts`: Book catalog, purchases
  - `app/utils/training.prisma.ts`: Training exercises
  - `app/utils/video.prisma.ts`: Video content
  - `app/utils/qa.server.ts`: Q&A system queries
- Pattern: Public async functions that return typed data, called from routes
- Example: `getAllExcersices()`, `getExersiceBySearch(whereClause)`

**Form Validators:**
- Purpose: Input validation logic reused across forms
- Files: `app/utils/validators.server.ts`
- Pattern: Validator functions return error message or falsy value
- Usage: Called in action functions before processing

**Cloudinary Integration:**
- Purpose: File upload, image management, CDN delivery
- Files: `app/utils/cloudinary.server.ts`
- Pattern: SDK wrapper functions for upload, delete, transformation
- Used by: Upload routes for exercises, books, tutorials

**Supabase Realtime:**
- Purpose: Real-time chat, presence, notifications
- Files: `utils/supabase.ts`
- Pattern: Client singleton initialized with env vars
- Tables: `users`, `messages` - synced from Prisma on login

## Entry Points

**Web Application Root:**
- Location: `app/root.tsx`
- Triggers: All HTTP requests
- Responsibilities:
  - Layout wrapper (NavList, Footer, Outlet)
  - Global loader: locale detection, user authentication, ENV vars
  - Error boundary for unhandled errors
  - i18n setup via i18next

**Server Entry:**
- Location: `app/entry.server.tsx`
- Triggers: Server startup, every HTTP request
- Responsibilities:
  - SSR rendering via React's renderToPipeableStream
  - i18n instance creation and initialization
  - Security headers (X-Frame-Options, HSTS, CSP)
  - Bot detection (isbot) for appropriate rendering

**Client Entry:**
- Location: `app/entry.client.tsx`
- Triggers: Browser startup after hydration
- Responsibilities:
  - Client-side React hydration
  - Set up client-only functionality

**Route Entry Points (selected key routes):**
- `app/routes/_index.tsx`: Landing page with hero, features, newsletter signup
- `app/routes/exercises._index.tsx`: Exercise gallery with filtering
- `app/routes/chat._index.tsx`: Real-time chat application
- `app/routes/books._index.tsx`: Book e-commerce catalog
- `app/routes/login.tsx`: Authentication form
- `app/routes/uploadEx.tsx`: Admin upload interface for content
- `app/routes/qa._index.tsx`: Q&A system feed

## Error Handling

**Strategy:** Multi-level error boundaries and try-catch patterns

**Patterns:**
- Route ErrorBoundary: `app/root.tsx` catches unhandled errors, renders error page
- Loader/action try-catch: Database errors logged, generic error returned to client
- Form validation: Client-side display of field errors via ActionData
- Database connection: Global prisma singleton with reuse, fallback on connection error
- Supabase operations: Error logging, graceful degradation for chat features
- External API calls: Timeout handling, retry logic for Stripe, Cloudinary

**Example (login action):**
```typescript
// From app/routes/login.tsx
const errors = {
  email: validateEmail(email),
  password: validatePassword(password),
};
if (Object.values(errors).some(Boolean))
  return data({ errors, fields: {...} }, { status: 400 });
return await login({ email, password });
```

## Cross-Cutting Concerns

**Logging:**
- Approach: console.log/error for debugging, structured logging via SDK errors
- Key locations: `auth.prisma.ts`, `entry.server.tsx`, utility functions
- Production: Error reporting via console, could integrate Sentry

**Validation:**
- Approach: Server-side validators in `app/utils/validators.server.ts`
- Pattern: Validator functions return error string or falsy
- Scope: Email, password, form data validation before database writes

**Authentication:**
- Approach: Session-based with cookie storage + Google OAuth fallback
- Flow: `getUser()` checks cookie session, retrieves user from Prisma
- Protected routes: Use `requireUserId()` to enforce authentication
- Sync: `chatAuthorization()` syncs user to Supabase for chat features

**i18n (Internationalization):**
- Approach: react-i18next with JSON locale files
- Setup: `app/i18next.server.ts` for server-side locale detection
- Provider: I18nextProvider wraps RemixServer in entry.server.tsx
- Usage: Components use `useTranslation()` hook, `t()` function
- Files: `public/locales/el/common.json`, `public/locales/en/common.json`

**CSRF Protection:**
- Approach: Via `csrf.server.ts` utility
- Implemented in: Upload routes, form submission routes

**Rate Limiting:**
- Approach: Via `ratelimit.server.ts` utility
- Applied to: Chat messages, API endpoints, form submissions

**Image/File Management:**
- Approach: Cloudinary for storage, CDN delivery
- Pattern: Upload via SDK, store public ID + URL in database
- Usage: Exercises (PDF + preview), books (thumbnail), profiles (pictures)

---

*Architecture analysis: 2026-02-21*
