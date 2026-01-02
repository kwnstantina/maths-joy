import crypto from "crypto";
import { createCookieSessionStorage } from "@remix-run/node";

// CSRF session storage (separate from main session)
const csrfSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_csrf",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [process.env.SESSION_SECRET || "csrf-secret-change-me"],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
  },
});

const CSRF_TOKEN_KEY = "csrfToken";

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Get the CSRF session from request
 */
async function getCSRFSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return csrfSessionStorage.getSession(cookie);
}

/**
 * Get or create CSRF token for a request
 * Returns both the token and the Set-Cookie header
 */
export async function getCSRFToken(
  request: Request
): Promise<{ token: string; headers: Headers }> {
  const session = await getCSRFSession(request);
  let token = session.get(CSRF_TOKEN_KEY);

  if (!token) {
    token = generateCSRFToken();
    session.set(CSRF_TOKEN_KEY, token);
  }

  const headers = new Headers();
  headers.append("Set-Cookie", await csrfSessionStorage.commitSession(session));

  return { token, headers };
}

/**
 * Validate CSRF token from form submission
 */
export async function validateCSRFToken(
  request: Request,
  formToken: string | null
): Promise<boolean> {
  if (!formToken) {
    return false;
  }

  const session = await getCSRFSession(request);
  const sessionToken = session.get(CSRF_TOKEN_KEY);

  if (!sessionToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(formToken),
      Buffer.from(sessionToken)
    );
  } catch {
    return false;
  }
}

/**
 * Validate CSRF and return error response if invalid
 * Returns null if valid, or a Response if invalid
 */
export async function requireCSRFToken(
  request: Request
): Promise<Response | null> {
  const formData = await request.clone().formData();
  const token = formData.get("_csrf") as string | null;

  const isValid = await validateCSRFToken(request, token);

  if (!isValid) {
    return new Response(
      JSON.stringify({ error: "Invalid CSRF token" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return null;
}

/**
 * Helper to merge CSRF headers with other headers
 */
export function mergeHeaders(
  csrfHeaders: Headers,
  otherHeaders?: HeadersInit
): Headers {
  const merged = new Headers(otherHeaders);
  csrfHeaders.forEach((value, key) => {
    merged.append(key, value);
  });
  return merged;
}
