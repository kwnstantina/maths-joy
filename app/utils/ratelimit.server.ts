/**
 * Simple in-memory rate limiter for development/small deployments
 * For production at scale, consider using Redis
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Predefined rate limit configurations
export const RATE_LIMITS = {
  upload: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  download: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  api: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 minutes
  contact: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  chat: { maxRequests: 30, windowMs: 10 * 60 * 1000 }, // 30 per 10 minutes
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // milliseconds until reset
}

/**
 * Check if a request is allowed based on rate limiting
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType
): RateLimitResult {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Increment count
  entry.count++;
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = entry.resetTime - now;

  return { allowed, remaining, resetIn };
}

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return `ip:${ip}`;
}

/**
 * Create a rate limit response with appropriate headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  type: RateLimitType
): Response {
  const config = RATE_LIMITS[type];
  const retryAfter = Math.ceil(result.resetIn / 1000);

  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(config.maxRequests),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetIn / 1000)),
      },
    }
  );
}

/**
 * Utility to apply rate limiting in a loader/action
 * Returns null if allowed, or a Response if rate limited
 */
export function applyRateLimit(
  request: Request,
  type: RateLimitType,
  userId?: string
): Response | null {
  const identifier = getRateLimitIdentifier(request, userId);
  const result = checkRateLimit(identifier, type);

  if (!result.allowed) {
    return createRateLimitResponse(result, type);
  }

  return null;
}
