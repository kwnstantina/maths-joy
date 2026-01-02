# Maths-Joy Platform Redesign Progress

## Overview

This document tracks the progress of the radical platform redesign initiated to support:
- E-commerce (selling PDF textbooks via Stripe)
- Complete i18n (Greek/English for all content)
- Q&A system (Stack Overflow-style, replacing real-time chat)
- Cloud file storage (Cloudinary instead of Base64 in MongoDB)
- Security hardening
- Code quality improvements

**Last Updated**: December 31, 2025

---

## Completed Phases

### Phase 0: Security Hardening

**Status**: Completed

#### Changes Made:

1. **Cookie Security** - [services/cookies/cookies.js](services/cookies/cookies.js)
   - Added `maxAge: 60 * 60 * 24 * 365` (1 year expiration)
   - Added `secure: process.env.NODE_ENV === 'production'`

2. **Authentication Security** - [app/utils/auth.prisma.ts](app/utils/auth.prisma.ts)
   - Fixed hardcoded callback URL: now uses `process.env.GOOGLE_CALLBACK_URL`
   - Removed password from error responses (prevents credential exposure)
   - Generic error messages for login failures (prevents user enumeration)
   - Combined user not found + wrong password into single generic error

3. **File Validation** - [app/utils/validators.server.ts](app/utils/validators.server.ts)
   - Increased minimum password length from 5 to 8 characters
   - Added proper MIME type validation for file uploads
   - Added file size validation (max 10MB)
   - Added `validateRedirectUrl()` to prevent open redirect attacks

4. **Security Headers** - [app/entry.server.tsx](app/entry.server.tsx)
   - Added `X-Frame-Options: DENY`
   - Added `X-Content-Type-Options: nosniff`
   - Added `Referrer-Policy: strict-origin-when-cross-origin`
   - Added `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - Added `Strict-Transport-Security` for production

---

### Phase 0.5: Language Persistence

**Status**: Completed

**Problem**: Language selection was lost on page refresh because:
1. Cookie `Set-Cookie` header was commented out in `root.tsx`
2. Server language was hardcoded to 'el' in `entry.server.tsx`

#### Changes Made:

1. **Root Loader** - [app/root.tsx](app/root.tsx)
   - Uncommented the `Set-Cookie` header to persist locale

2. **Server Entry** - [app/entry.server.tsx](app/entry.server.tsx)
   - Changed `lng: 'el'` (hardcoded) to `lng` (detected from cookie/request)
   - Added `fallbackLng: 'el'`

3. **Language API Route** - [app/routes/api/language.tsx](app/routes/api/language.tsx) (NEW FILE)
   - POST endpoint to persist language selection to cookie
   - Validates language is 'el' or 'en'
   - Sets cookie via `i18nCookie.serialize()`

4. **Language Indicator** - [components/languageIndicator/languageIndicator.tsx](components/languageIndicator/languageIndicator.tsx)
   - Now uses `useFetcher()` to POST to `/api/language`
   - Initializes from `i18n.language` instead of hardcoded default
   - Added `useEffect` to sync when language changes externally

---

### Phase 0.6: Translation Schema & Keys

**Status**: Completed

#### Changes Made:

1. **i18n Server Utilities** - [app/utils/i18n.server.ts](app/utils/i18n.server.ts) (NEW FILE)
   - `getLocalizedContent()` - Get translated fields for single item
   - `getLocalizedList()` - Get translated fields for array of items
   - `parseTranslation()` - Handle both JSON string and object translations
   - `isValidLanguage()` - Validate language codes
   - `getLanguageFromRequest()` - Extract language from URL params
   - Type definitions: `LocalizedContent`, `Translations`, `Translatable`

2. **English Translations** - [public/locales/en/common.json](public/locales/en/common.json)
   - Added comprehensive translation keys for all features

3. **Greek Translations** - [public/locales/el/common.json](public/locales/el/common.json)
   - Added corresponding Greek translations for all keys

---

### Phase 0.7: Code Refactoring

**Status**: Completed

#### Changes Made:

1. **Type Safety in auth.prisma.ts** - [app/utils/auth.prisma.ts](app/utils/auth.prisma.ts)
   - Created `GoogleProfile`, `DbUser`, `GoogleStrategyConfig` interfaces
   - Replaced `as any` with proper types
   - Fixed logout function to use typed user

2. **Type Safety & Memory Leak Fix in chat/index.tsx** - [app/routes/chat/index.tsx](app/routes/chat/index.tsx)
   - Created `ChatUser`, `ChatMessage`, `LoaderData`, `EmojiData` interfaces
   - Fixed memory leak: use functional `setMessages(prev => ...)` instead of closure
   - Removed `messages` from useEffect dependencies
   - Added error handling to Supabase queries
   - Removed unused scroll functionality (dead code)

3. **Type Safety in uploadEx.tsx** - [app/routes/uploadEx.tsx](app/routes/uploadEx.tsx)
   - Created `UploadFormData`, `FilterEvent`, `ActionType` types
   - Fixed ErrorBoundary typing
   - Fixed handlers with proper React types
   - Improved file upload error handling

4. **Type Safety in exercises/index.tsx** - [app/routes/exercises/index.tsx](app/routes/exercises/index.tsx)
   - Created `Exercise`, `ExerciseFilters`, `FilterEvent`, `WhereClause` interfaces
   - Typed all state and handlers properly

5. **Removed Dead Code**:
   - Commented loader in `login.tsx:8-11`
   - Commented filtering in `exercises/index.tsx:80-114`
   - HTML comments in `chatContent.tsx:82-85`
   - Duplicate `validateEmail` in `utils/utils.ts`

6. **Fixed Types in Utilities**:
   - `utils/utils.ts` - Fixed `groupBy`, `isEqual`, `dateTimeFormat` types
   - `types.server.ts` - Removed `any` from `UploadExersiceForm`, `CreateTrainingExersice`

---

### Phase 1: Cloudinary Migration

**Status**: Completed

#### Changes Made:

1. **Cloudinary Utility** - [app/utils/cloudinary.server.ts](app/utils/cloudinary.server.ts) (NEW FILE)
   - `uploadToCloudinary()` - Upload files with folder organization
   - `deleteFromCloudinary()` - Remove files by public ID
   - `generateSignedUrl()` - Create secure download URLs
   - Configures Cloudinary from environment variables
   - Supports resource_type options (raw, image, video)

2. **Prisma Schema Updates** - [prisma/schema.prisma](prisma/schema.prisma)
   - Added to `Exersice` model:
     - `cloudinaryPublicId String?`
     - `cloudinaryUrl String?`
     - `fileSize Int?`
   - Added `Book` model for e-commerce
   - Added `Purchase` model for tracking sales

3. **Exercise Upload Integration** - [app/utils/exersices.prisma.ts](app/utils/exersices.prisma.ts)
   - Upload to Cloudinary when configured
   - Fallback to legacy Base64 if Cloudinary unavailable
   - Store Cloudinary URL and public ID in database

4. **PDF Viewer** - [app/routes/exercises/$pdfId.tsx](app/routes/exercises/$pdfId.tsx)
   - Use Cloudinary URL when available
   - Fallback to Base64 for legacy files

---

### Phase 2: E-commerce (Stripe + Books)

**Status**: Completed

#### Changes Made:

1. **Stripe Utility** - [app/utils/stripe.server.ts](app/utils/stripe.server.ts) (NEW FILE)
   - `createCheckoutSession()` - Create Stripe checkout for book purchase
   - `handlePaymentSuccess()` - Mark purchase as completed
   - `handlePaymentFailure()` - Handle failed payments
   - `verifyDownloadToken()` - Validate and increment download count
   - `getUserPurchases()` - Get user's purchased books
   - `verifyWebhookSignature()` - Verify Stripe webhook authenticity
   - Auto-creates Stripe products and prices if not exist

2. **Books Listing** - [app/routes/books/index.tsx](app/routes/books/index.tsx) (NEW FILE)
   - Grid display of available books
   - Price formatting by locale (EUR)
   - Category badges
   - Link to book details

3. **Book Details & Checkout** - [app/routes/books/$bookId.tsx](app/routes/books/$bookId.tsx) (NEW FILE)
   - Full book details with description
   - Purchase button redirects to Stripe checkout
   - Shows "Already Purchased" if user owns book
   - Login redirect for unauthenticated users

4. **User Purchases** - [app/routes/purchases.tsx](app/routes/purchases.tsx) (NEW FILE)
   - List of user's purchased books
   - Download links with token authentication
   - Download count tracking
   - Purchase status badges

5. **Stripe Webhook** - [app/routes/api/stripe-webhook.tsx](app/routes/api/stripe-webhook.tsx) (NEW FILE)
   - Handles `checkout.session.completed`
   - Handles `checkout.session.expired`
   - Verifies webhook signatures
   - Updates purchase status

6. **Download Route** - [app/routes/download/$token.tsx](app/routes/download/$token.tsx) (NEW FILE)
   - Validates download token
   - Proxies file from Cloudinary (hides URL)
   - Sets proper Content-Disposition headers
   - Increments download count

---

### Phase 3: Q&A System

**Status**: Completed

#### Changes Made:

1. **Database Models** - [prisma/schema.prisma](prisma/schema.prisma)
   - `Question` model - Questions with title, body, category, tags
   - `Answer` model - Answers linked to questions
   - `QuestionVote` model - Upvote/downvote on questions
   - `AnswerVote` model - Upvote/downvote on answers
   - Vote counts, view counts, accepted answer tracking

2. **Q&A Utility** - [app/utils/qa.server.ts](app/utils/qa.server.ts) (NEW FILE)
   - `createQuestion()` / `getQuestions()` / `getQuestionById()`
   - `createAnswer()` / `getAnswersByQuestionId()`
   - `voteQuestion()` / `voteAnswer()` - Toggle voting
   - `acceptAnswer()` - Mark answer as accepted
   - `deleteQuestion()` / `deleteAnswer()`
   - `getUserVotes()` - Get user's votes on question/answers
   - `getQuestionCategories()` / `getPopularTags()`

3. **Questions List** - [app/routes/qa/index.tsx](app/routes/qa/index.tsx) (NEW FILE)
   - Paginated question list with stats (votes, answers, views)
   - Category filter sidebar
   - Popular tags filter
   - Search functionality
   - "Resolved" indicator for questions with accepted answers

4. **Question Detail** - [app/routes/qa/$questionId.tsx](app/routes/qa/$questionId.tsx) (NEW FILE)
   - Full question view with voting
   - Answers sorted by votes (accepted first)
   - Answer submission form
   - Accept answer (for question author)
   - Delete question/answer (for authors)

5. **Ask Question** - [app/routes/qa/ask.tsx](app/routes/qa/ask.tsx) (NEW FILE)
   - Title, body, category form
   - Tag selection with suggestions
   - Custom tag input
   - Form validation

---

### Phase 4: Complete i18n

**Status**: Completed

#### Changes Made:

1. **English Translations** - [public/locales/en/common.json](public/locales/en/common.json)
   - Added 50+ Q&A translation keys
   - Added 15+ books/purchases translation keys
   - All UI text now uses translation keys

2. **Greek Translations** - [public/locales/el/common.json](public/locales/el/common.json)
   - Complete Greek translations for all new keys
   - Professional translations for user-facing text

---

## Files Reference

### New Files Created

| File | Purpose |
|------|---------|
| `app/routes/api/language.tsx` | Language persistence API |
| `app/utils/i18n.server.ts` | Server-side translation utilities |
| `app/utils/cloudinary.server.ts` | Cloudinary upload/delete utilities |
| `app/utils/stripe.server.ts` | Stripe payment handling |
| `app/utils/qa.server.ts` | Q&A system database operations |
| `app/routes/books/index.tsx` | Books listing page |
| `app/routes/books/$bookId.tsx` | Book detail & checkout |
| `app/routes/purchases.tsx` | User purchases page |
| `app/routes/api/stripe-webhook.tsx` | Stripe webhook handler |
| `app/routes/download/$token.tsx` | Secure file download |
| `app/routes/qa/index.tsx` | Questions listing |
| `app/routes/qa/$questionId.tsx` | Question detail & answers |
| `app/routes/qa/ask.tsx` | Ask new question form |

### Modified Files

| File | Changes |
|------|---------|
| `services/cookies/cookies.js` | Cookie security (maxAge, secure) |
| `app/utils/auth.prisma.ts` | Auth security, type safety |
| `app/utils/validators.server.ts` | Validation improvements |
| `app/entry.server.tsx` | Security headers, language fix |
| `app/root.tsx` | Cookie header uncommented |
| `components/languageIndicator/languageIndicator.tsx` | Fetcher for persistence |
| `public/locales/en/common.json` | +100 translation keys |
| `public/locales/el/common.json` | +100 Greek translations |
| `prisma/schema.prisma` | Book, Purchase, Question, Answer, Vote models |
| `app/utils/exersices.prisma.ts` | Cloudinary integration |
| `app/routes/exercises/$pdfId.tsx` | Cloudinary URL support |

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Add to `.env`:

```env
# Existing
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Auth
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/callback

# Cloudinary (for file storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=http://localhost:3000
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Push Schema to Database

```bash
npx prisma db push
```

### 5. Set Up Stripe Webhook (for production)

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe-webhook`
3. Select events: `checkout.session.completed`, `checkout.session.expired`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 6. Run Development Server

```bash
npm run dev
```

---

## Remaining Tasks

### Recommended Next Steps

1. **Add navigation links** to new pages in the navbar:
   - `/books` - Books store
   - `/qa` - Q&A forum
   - `/purchases` - My purchases (for logged-in users)

2. **Admin functionality** (optional):
   - Book management (create/edit/delete)
   - Question moderation
   - User management

3. **Testing**:
   - Test Stripe checkout flow with test cards
   - Test download functionality
   - Test Q&A voting and accept answer

4. **Migrate existing chat users** (optional):
   - The old chat system can remain or be removed
   - Q&A system is separate and does not require migration

---

## Security Notes

- The `.env` file should NEVER be committed to git
- Stripe webhook secret is used to verify webhook authenticity
- Download tokens are secure random 64-character hex strings
- File downloads are proxied through the server (Cloudinary URLs hidden)
- All user inputs are validated server-side
