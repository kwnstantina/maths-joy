# Coding Conventions

**Analysis Date:** 2026-02-21

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `navList.tsx`, `modal.tsx`, `card.tsx`)
- Server utilities: camelCase with `.server.ts` suffix (e.g., `auth.prisma.ts`, `csrf.server.ts`, `ratelimit.server.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useChangeLanguage.ts`, `usePrevious.ts`, `useDetectOutside.ts`)
- Route files: Remix v2 flat file convention with brackets (e.g., `_index.tsx`, `$bookId.tsx`, `qa._index.tsx`)
- Utility/service files: camelCase or descriptive names (e.g., `validators.server.ts`, `utils.ts`, `models.ts`)

**Functions:**
- Regular functions: camelCase (e.g., `getUser`, `createUserSession`, `validateEmail`)
- React components: PascalCase (e.g., `FeatureSection`, `Modal`, `Card`)
- Custom hooks: camelCase with `use` prefix (e.g., `usePrevious`, `useChangeLanguage`)
- Exported utility functions: camelCase (e.g., `checkRateLimit`, `getCSRFToken`, `validateCSRFToken`)
- Internal helper functions: camelCase (e.g., `getCSRFSession`, `getRateLimitIdentifier`)

**Variables:**
- State and props: camelCase (e.g., `isLoggedIn`, `userIsAdmin`, `handleClick`)
- Constants: UPPER_SNAKE_CASE for global constants (e.g., `PASSWORD_MIN_LENGTH`, `FILE_MAX_SIZE_MB`, `ALLOWED_MIME_TYPES`, `RATE_LIMITS`)
- Type/interface fields: camelCase (e.g., `firstName`, `lastName`, `profilePicture`)
- React hooks: camelCase (e.g., `const [nav, setNav]`, `const { t } = useTranslation()`)

**Types:**
- Interface names: PascalCase with descriptive naming (e.g., `RegisterForm`, `LoginForm`, `GoogleProfile`, `DbUser`, `NavbarProps`)
- Type parameters: PascalCase (e.g., `Props`, `ActionData`, `LoaderData`)
- Enum-like objects: UPPER_CASE with consistent structure (e.g., `TAGS`, `Category`, `Type`, `RATE_LIMITS`)

## Code Style

**Formatting:**
- No dedicated Prettier config detected; code follows standard JavaScript/TypeScript conventions
- Line length: No strict limit enforced, but code appears to prefer readable line widths
- Indentation: 2 spaces (evident from all source files)
- Semicolons: Used consistently throughout (not optional)
- Quotes: Double quotes preferred in JSX attributes and strings

**Linting:**
- Tool: ESLint with configuration at `.eslintrc.cjs`
- Key rules enforced:
  - `@typescript-eslint/no-unused-vars`: Variables prefixed with `_` are ignored (e.g., `const [, setNav]`)
  - `@typescript-eslint/no-explicit-any`: Warns when `any` is used
  - React hooks rules enforced via `plugin:react-hooks/recommended`
  - JSX accessibility rules via `plugin:jsx-a11y/recommended`
  - Import order rules via `plugin:import/recommended`

**Import Statement Organization:**
- Order enforced by ESLint config:
  1. Builtin modules (e.g., `import crypto from "crypto"`)
  2. External dependencies (e.g., `import { remix } from "@remix-run/dev"`, `import bcrypt from "bcryptjs"`)
  3. Internal aliases (paths starting with `~/`)
  4. Parent relative imports (e.g., `import AuthService from "../../services/auth"`)
  5. Sibling relative imports (e.g., `import useDetectOutside from "hooks/useDetectOutside"`)
  6. Index imports

- Path aliases configured in `tsconfig.json`:
  - `~/*` → `./app/*` (main app directory alias for cleaner imports)

Example from `app/root.tsx`:
```typescript
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  // ... more imports
} from "@remix-run/react";
import Footer from "components/footer/footer";
import NavList from "components/navs/navList";
import "./styles/app.css";
import LoadingPage from "components/loadingPage/loadingPage";
import { useState } from "react";
import usePrevious from "hooks/usePrevious";
import i18next from "~/i18next.server";
import { getUser } from "~/utils/auth.prisma";
```

**Import path conventions:**
- External libraries and remix packages: Direct imports
- Internal components: Path from root (e.g., `components/footer/footer`, `hooks/usePrevious`)
- App utilities and services: Alias prefix `~/` (e.g., `~/utils/auth.prisma`, `~/i18next.server`)

## Error Handling

**Patterns:**
- Try-catch with empty catch blocks for graceful degradation (e.g., in `app/root.tsx` loader, user loading wrapped in try-catch)
- Generic error messages returned to prevent information leakage (e.g., "Invalid credentials" instead of "User not found" vs "Wrong password")
- Error boundary component (`ErrorBoundary` function in `app/root.tsx`) for route-level error handling
- Form validation errors returned as structured objects with field-specific error messages
- Rate limit exceeded returns HTTP 429 with JSON error response and retry headers
- CSRF token validation failures return HTTP 403 with JSON error response

Example from `app/utils/auth.prisma.ts`:
```typescript
export async function login({ email, password }: LoginForm) {
  const genericError = { error: `errors.invalidCredentials` };

  if (email == null || password == null) {
    return json(genericError, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Use same error for both conditions to prevent user enumeration
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return json(genericError, { status: 400 });
  }

  return createUserSession(user.id, "/");
}
```

## Logging

**Framework:** Native `console` object (no structured logging library)

**Patterns:**
- `console.log()` for general information (e.g., form submission debug logs in `app/routes/_index.tsx`)
- `console.error()` for errors (e.g., "Error:", "Error updating user status:" in multiple utility files)
- Logging in error handlers and status updates (e.g., user status updates, authentication errors)
- Server-side only logging for sensitive operations (e.g., contact form submissions)

Example from `app/root.tsx`:
```typescript
try {
  const dbUser = await getUser(request);
  // ...
} catch {
  // User not logged in or session expired
}
// ...
console.error("Error:", errorMessage);
```

## Comments

**When to Comment:**
- Function-level JSDoc comments for public utility functions (e.g., CSRF token functions, validators, rate limit functions)
- Inline comments explaining security decisions (e.g., "Use same error for 'user not found' and 'wrong password' to prevent enumeration")
- Inline comments for non-obvious logic (e.g., timing-safe comparison note in CSRF validation)
- Comments documenting why empty catches exist (e.g., "User not logged in or session expired")

**JSDoc/TSDoc Pattern:**
- Used for utility functions and exports in `.server.ts` files
- Parameter descriptions with `@param`
- Return type descriptions with return statement
- Example from `app/utils/csrf.server.ts`:
```typescript
/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate CSRF token from form submission
 */
export async function validateCSRFToken(
  request: Request,
  formToken: string | null
): Promise<boolean> {
```

## Function Design

**Size:** Functions range from single-purpose utilities (5-10 lines) to feature-rich handlers (50-100 lines)

**Parameters:**
- Destructured parameters for objects (e.g., `{ request }` in loaders, `{ firstName, lastName }` in objects)
- Single parameter for request handlers is Request object
- Props objects destructured in component parameters
- Type annotations always present for exported functions

Example patterns:
```typescript
// Loaders/Actions
export const loader: LoaderFunction = async ({ request, params }) => {
  // ...
}

// Component functions with props
const FeatureSection = ({
  titleKey,
  descriptionKey,
  linkKey,
  linkTo,
  accentColor,
  reversed = false,
  imageSrc
}: FeatureSectionProps): JSX.Element => {
  // ...
}

// Utility functions
export async function login({ email, password }: LoginForm) {
  // ...
}
```

**Return Values:**
- Loaders/actions return `data()` or `json()` with typed response objects
- Utility functions return typed objects or void
- Components return JSX.Element
- Error handlers return Response objects with appropriate status codes
- Promise-returning functions explicitly typed with `Promise<T>`

## Module Design

**Exports:**
- Named exports for utilities and functions (e.g., `export const validateEmail`, `export function getUser`)
- Default exports for React components and main route components
- Type exports with `export type` for interfaces and types
- Barrel patterns not consistently used but some directories have shared exports

Example from `app/utils/validators.server.ts`:
```typescript
export const validateEmail = (email: string): string | undefined => { ... };
export const validatePassword = (password: string): string | undefined => { ... };
export const validateFile = (file: File | string, ...): string | undefined => { ... };
```

**Barrel Files:**
- Not widely used; imports typically reference specific files
- Exceptions: Some service directories like `services/` may have consolidated exports
- Preference for explicit file imports over barrel re-exports

---

*Convention analysis: 2026-02-21*
