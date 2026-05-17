# Technology Stack

**Analysis Date:** 2026-02-21

## Languages

**Primary:**
- TypeScript 5.7.2 - Full codebase including server and client components
- JSX/TSX - React component markup and Remix routes

**Secondary:**
- JavaScript - Configuration files (CommonJS modules for Vite, Tailwind, PostCSS)

## Runtime

**Environment:**
- Node.js 20.0.0+ (specified in `package.json` engines)
- .nvmrc: Node 20

**Package Manager:**
- npm (lockfile present: package-lock.json)

## Frameworks

**Core:**
- Remix 2.15.2 (`@remix-run/react`, `@remix-run/node`, `@remix-run/serve`) - Full-stack React framework with server-side rendering
- React 18.3.1 - UI framework
- Vite 5.4.11 - Build tool and dev server (configured via `vite.config.ts`)

**Styling:**
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- PostCSS 8.4.49 - CSS transformations with autoprefixer
- Custom animations and utilities in `tailwind.config.cjs`

**Internationalization:**
- i18next 23.16.8 - Translation framework
- remix-i18next 6.4.1 - Remix integration for i18next
- i18next-fs-backend 2.6.0 - File system backend for translations
- i18next-http-backend 3.0.1 - HTTP backend for translations
- i18next-browser-languagedetector 8.0.2 - Automatic language detection in browser

**Database:**
- Prisma 5.22.0 - ORM for MongoDB
  - `@prisma/client` 5.22.0 - Client library
  - Provider: MongoDB
  - Connection via `DATABASE_URL` environment variable

**Authentication:**
- remix-auth 3.7.0 - Authentication library for Remix
- remix-auth-google 2.0.0 - Google OAuth strategy
- bcryptjs 2.4.3 - Password hashing

**Payment Processing:**
- Stripe 17.4.0 - Payment gateway integration

**File Storage:**
- cloudinary 2.5.1 - Cloud file storage and management (PDFs, images)

**Real-time & Chat:**
- @supabase/supabase-js 2.47.10 - Supabase client for chat/real-time features
- Supabase PostgreSQL database alongside Prisma MongoDB

**Analytics:**
- @vercel/analytics 1.4.1 - Vercel Analytics integration

**UI Components & Libraries:**
- @headlessui/react 2.2.0 - Headless UI components
- @heroicons/react 2.2.0 - Icon library
- @emoji-mart/react 1.1.1 - Emoji picker component
- @emoji-mart/data 1.2.1 - Emoji data
- emoji-mart 5.6.0 - Emoji support
- @react-pdf-viewer/core 3.12.0 - PDF viewing
- @react-pdf-viewer/default-layout 3.12.0 - PDF default layout
- @react-pdf-viewer/page-navigation 3.12.0 - PDF page navigation
- better-react-mathjax 2.0.3 - MathJax integration for math rendering
- react-cmdk 1.3.9 - Command menu component
- react-dom 18.3.1 - React DOM rendering

**Security:**
- xss 1.0.15 - XSS (cross-site scripting) prevention

**Utilities:**
- html-entities 2.6.0 - HTML entity encoding/decoding
- isbot 5.1.17 - Bot detection

**Build & Development:**
- @remix-run/dev 2.15.2 - Remix dev tools
- @types/node 22.10.2 - Node.js type definitions
- @types/react 18.3.12 - React type definitions
- @types/react-dom 18.3.1 - React DOM type definitions
- @types/bcryptjs 2.4.6 - bcryptjs type definitions
- TypeScript 5.7.2 - Type checking
- vite-tsconfig-paths 5.1.4 - Vite plugin for tsconfig path aliases

## Linting & Code Quality

**Linting:**
- ESLint 8.57.1 - JavaScript/TypeScript linter
- @typescript-eslint/eslint-plugin 8.18.1 - TypeScript rules
- @typescript-eslint/parser 8.18.1 - TypeScript parser
- eslint-plugin-react 7.37.2 - React linting rules
- eslint-plugin-react-hooks 5.1.0 - React Hooks linting
- eslint-plugin-jsx-a11y 6.10.2 - Accessibility linting
- eslint-plugin-import 2.31.0 - Import sorting and validation
- eslint-import-resolver-typescript 3.7.0 - TypeScript resolver for eslint-import

**Configuration:**
- `.eslintrc.cjs` - ESLint configuration (root, React, TypeScript, and Node overrides)
- Import order enforced: builtin → external → internal → parent → sibling → index
- No Prettier configuration found - formatting via ESLint rules only

## Configuration

**Environment:**
- Environment variables via `.env` files (note: never read/commit secrets)
- Critical env vars: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

**Build:**
- Vite configuration: `vite.config.ts` - Remix plugin, TSConfig paths, PostCSS, SSR settings
- TypeScript configuration: `tsconfig.json` - ES2022 target, strict mode, path aliases (`~/*` → `./app/*`)
- Tailwind configuration: `tailwind.config.cjs` - Custom theme with animations
- PostCSS configuration: `postcss.config.cjs` - Tailwind + Autoprefixer

## Platform Requirements

**Development:**
- Node.js 20.0.0+
- npm for package management

**Production:**
- Deployment compatible with Remix (Node.js 20+)
- Supports Vercel deployment (analytics included)
- MongoDB database (Prisma)
- Supabase PostgreSQL (for chat/real-time)
- Stripe account (for payments)
- Cloudinary account (for file storage)
- Google OAuth credentials (for authentication)

---

*Stack analysis: 2026-02-21*
