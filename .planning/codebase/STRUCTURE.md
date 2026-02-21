# Codebase Structure

**Analysis Date:** 2026-02-21

## Directory Layout

```
maths-joy/
├── app/                           # Main application code
│   ├── routes/                    # Route components (Remix file-based routing)
│   ├── entry.server.tsx           # Server-side entry point (SSR)
│   ├── entry.client.tsx           # Client-side entry point (hydration)
│   ├── root.tsx                   # Root layout and global error boundary
│   ├── i18next.server.ts          # i18n server configuration
│   ├── i18n.ts                    # i18n shared configuration
│   ├── utils/                     # Server-side utilities and business logic
│   ├── styles/                    # Global CSS
│   └── assets/                    # Static assets (images, logos, SVGs)
├── components/                    # Reusable React components
├── hooks/                         # Custom React hooks
├── services/                      # Domain models, constants, i18n
├── utils/                         # Shared utilities (supabase, helpers)
├── prisma/                        # Database schema and migrations
├── public/                        # Static files and i18n translations
├── package.json                   # NPM dependencies and scripts
├── tsconfig.json                  # TypeScript configuration with path aliases
├── vite.config.ts                 # Vite + Remix build configuration
├── tailwind.config.cjs            # TailwindCSS styling
└── postcss.config.cjs             # PostCSS processing
```

## Directory Purposes

**app/**
- Purpose: Core application code, follows Remix conventions
- Contains: Routes, entry points, utilities, styles
- Key files: `root.tsx` (global layout), `entry.server.tsx` (SSR), `entry.client.tsx` (hydration)

**app/routes/**
- Purpose: File-based route definitions and page components
- Contains: Route handlers with loader/action functions, form components
- Naming pattern:
  - `_index.tsx` = index route (e.g., `/exercises`)
  - `.` denotes nesting (e.g., `books._index.tsx` = `/books`)
  - `$param` for dynamic segments (e.g., `books.$bookId.tsx` = `/books/:bookId`)
  - `api.*.tsx` for API endpoints
  - `auth.*` for authentication routes
  - `_layout` for layout routes (not in current use)
- Key routes:
  - `_index.tsx`: Landing page
  - `exercises._index.tsx`: Exercise gallery with filtering
  - `books._index.tsx`: Book catalog
  - `chat._index.tsx`: Real-time chat
  - `login.tsx`, `signup.tsx`, `logout.ts`: Auth flows
  - `uploadEx.tsx`: Admin content upload
  - `qa._index.tsx`, `qa.ask.tsx`: Q&A system

**app/utils/**
- Purpose: Server-side business logic and database queries
- Contains:
  - `*.prisma.ts`: Database query functions (exercises, books, training, video, progress, qa)
  - `*.server.ts`: Server-only utilities (auth, cloudinary, stripe, csrf, ratelimit, audit)
  - `validators.server.ts`: Input validation functions
  - `types.server.ts`: TypeScript types for forms and data
  - `roles.ts`: Role-based access control definitions
  - `i18n.server.ts`: Server-side i18n helpers
  - `prisma.server.ts`: Prisma client singleton
- All files with `.server` suffix are server-only, never shipped to client

**app/styles/**
- Purpose: Global CSS and styling configuration
- Contains: `app.css` with Tailwind imports
- Uses: Tailwind utility classes throughout components

**app/assets/**
- Purpose: Static assets embedded in the application
- Contains: Logos (mathsLogo.png), SVG icons
- Subdirectory: `svg/` for inline SVG files

**components/**
- Purpose: Reusable React UI components
- Organization: Feature-based subdirectories
- Key component groups:
  - `chat/`: Chat interface and message display
  - `uploadExTabs/`: File upload tabs for exercises, books, tutorials
  - `navs/`: Navigation bar, user settings
  - `lists/`: List rendering (exercises, items)
  - `search/`: Search input and results
  - `video/`: Video player and video list
  - `training/`: Training exercise display
  - `formField/`: Form input wrappers
  - `input/`: Base input components
  - `card/`: Card container component
  - `modal/`: Modal dialog wrapper
  - `alerts/`: Alert/notification components
  - `errorPage/`: Error display page
  - `loadingPage/`: Loading skeleton
  - `intro/`: Introduction section
  - `aboutUs/`: About section
  - `newsletter/`: Newsletter signup form
  - `footer/`: Footer component
  - `kbar/`: Keyboard command bar
  - `languageIndicator/`: Language selector
- Pattern: Each component in its own directory with `.tsx` file

**hooks/**
- Purpose: Custom React hooks for shared logic
- Contains:
  - `useChangeLanguage.ts`: Language switching logic
  - `useDetectOutside.ts`: Detect clicks outside element (modals, dropdowns)
  - `usePrevious.ts`: Store previous value for comparison
  - `useScrollToTop.tsx`: Auto-scroll to top on route change

**services/**
- Purpose: Domain models, constants, configuration
- Contains:
  - `models/models.ts`: Data models (TAGS, Category, Type) - education taxonomy
  - `cookies/cookies.ts`: Cookie configuration for i18n persistence
  - `i18.ts`: i18n configuration object
  - `i18nextOptions.js`: i18n options for browser
- Files: Primarily constants and configuration, minimal logic

**utils/**
- Purpose: Shared utilities usable in both server and client
- Contains:
  - `supabase.ts`: Supabase client singleton for real-time chat
  - `utils.ts`: Helper functions (arrayOfColors, etc.)

**prisma/**
- Purpose: Database schema and migrations
- Contains:
  - `schema.prisma`: Complete MongoDB schema with models (User, Exercise, Book, Purchase, etc.)
- Models: User, Exersice, Book, Purchase, Training, Video, Question, Answer, QuestionVote, AnswerVote

**public/**
- Purpose: Static files and i18n translation files
- Contains:
  - `locales/`: Translation JSON files
    - `el/common.json`: Greek translations
    - `en/common.json`: English translations
  - Other static assets served directly (if present)

**Root-level Configuration Files:**
- `package.json`: Dependencies, build/dev scripts
- `tsconfig.json`: TypeScript configuration with `~/*` → `app/*` path alias
- `vite.config.ts`: Vite build tool and Remix plugin configuration
- `tailwind.config.cjs`: Tailwind CSS utility configuration
- `postcss.config.cjs`: PostCSS processing for Tailwind
- `.eslintrc.*`: Linting rules (not shown but present)
- `.prettierrc`: Code formatting config (if present)

## Key File Locations

**Entry Points:**
- `app/root.tsx`: Global layout, error boundary, user loader
- `app/entry.server.tsx`: Server-side rendering, i18n initialization
- `app/entry.client.tsx`: Client hydration
- `app/routes/_index.tsx`: Landing page route

**Configuration:**
- `tsconfig.json`: TypeScript settings
- `vite.config.ts`: Build tool configuration
- `tailwind.config.cjs`: Styling defaults
- `prisma/schema.prisma`: Database schema

**Core Logic:**
- `app/utils/prisma.server.ts`: Database client singleton
- `app/utils/auth.prisma.ts`: Authentication logic, session management
- `app/utils/exersices.prisma.ts`: Exercise queries and filtering
- `app/utils/books.prisma.ts`: Book catalog and purchases
- `app/utils/stripe.server.ts`: Stripe payment integration
- `app/utils/cloudinary.server.ts`: File upload integration

**Testing:**
- Not currently present; would go in `__tests__/` or `*.test.ts` files

## Naming Conventions

**Files:**
- `*.tsx`: React components (client or route components)
- `*.ts`: TypeScript modules (logic, utilities)
- `*.server.ts`: Server-only files (never shipped to browser)
- `*.prisma.ts`: Database query modules
- `_index.tsx`: Index routes (Remix convention)
- Lowercase with dots: `lodash.case` style (e.g., `auth.prisma.ts`, `user.server.ts`)

**Directories:**
- Lowercase with hyphens for multi-word: `upload-ex-tabs`, `chat-content`
- Feature-based: Component directories named after feature (e.g., `chat/`, `training/`)
- Plural for collections: `routes/`, `components/`, `utils/`, `services/`

**Components:**
- PascalCase for exported components: `ChatContent`, `UserSettings`, `SearchInput`
- Functional components with React hooks
- Props interfaces named `{ComponentName}Props`

**Types & Interfaces:**
- PascalCase: `RegisterForm`, `ChatUser`, `Exercise`, `LoaderData`
- Generic types: `JsonValue` from Prisma
- Model types: Match database model names from Prisma schema

**Functions:**
- camelCase: `getUser()`, `createUserSession()`, `validateEmail()`
- Async functions: Use `async`/`await`
- Prefixes for special functions:
  - `get*`: Fetch operations
  - `create*`: Create operations
  - `update*`: Modify operations
  - `delete*`: Remove operations
  - `validate*`: Validation logic
  - `use*`: React hooks

## Where to Add New Code

**New Feature:**
- Primary code: `app/routes/feature._index.tsx` for main page, `app/routes/feature.*.tsx` for sub-routes
- Database queries: `app/utils/feature.prisma.ts`
- Components: `components/feature/` directory
- Tests: `components/feature/__tests__/` or `app/routes/__tests__/feature.test.tsx`

**New Component/Module:**
- Implementation: `components/{featureName}/` directory
- Export from: Component's index file if creating sub-components
- Usage: Import in routes or parent components

**Utilities & Helpers:**
- Shared server logic: `app/utils/{domain}.server.ts`
- Shared client logic: `hooks/{name}.ts` or `utils/{name}.ts`
- Database queries: `app/utils/{domain}.prisma.ts`
- Types: Add to `app/utils/types.server.ts` or local file

**Database Changes:**
- Update: `prisma/schema.prisma`
- Create migration: `npx prisma migrate dev --name {description}`
- Generate client: `npm run prisma:generate`
- Test: `npm run prisma:push` (dev) or seed: `npm run prisma:seed`

## Special Directories

**build/**
- Purpose: Compiled output directory
- Generated: Yes (from `npm run build`)
- Committed: No (in .gitignore)
- Contents: Server-side JS, browser bundle chunks

**node_modules/**
- Purpose: NPM dependencies
- Generated: Yes (from `npm install`)
- Committed: No (in .gitignore)
- Managed by: package-lock.json or package.json

**.planning/codebase/**
- Purpose: Architecture and code analysis documentation
- Generated: No (manually written by GSD mappers)
- Committed: Yes (shared with team)
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, etc.

**prisma/migrations/**
- Purpose: Database migration history
- Generated: Yes (from `prisma migrate`)
- Committed: Yes (version control)
- Contents: SQL or migration files tracking schema changes

**public/locales/**
- Purpose: Internationalization translation files
- Generated: No (manually maintained)
- Committed: Yes
- Contents: JSON files with key-value translations (el, en)

---

*Structure analysis: 2026-02-21*
