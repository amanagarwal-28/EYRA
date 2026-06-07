import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

/**
 * Module-level Redis client — reused across all rate-limit checks.
 * Null when Upstash env vars are absent (dev/staging without Redis).
 * Configure via:
 *   UPSTASH_REDIS_REST_URL   — REST endpoint from the Upstash console
 *   UPSTASH_REDIS_REST_TOKEN — read-write token (server-only, never NEXT_PUBLIC_)
 */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const TOO_MANY_REQUESTS = {
  error: "Submission frequency exceeded. Please try again later.",
};

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

/**
 * Checks the rate limit for the calling IP against the given namespace.
 *
 * Returns a 429 Response if the limit is exceeded, null otherwise.
 * When Upstash is not configured the check is skipped and null is returned
 * so routes stay functional in local development.
 *
 * @param request     The incoming NextRequest (used to extract the client IP).
 * @param namespace   Unique string per endpoint, e.g. "support_ticket".
 * @param maxPerHour  Maximum allowed requests per IP per sliding hour window.
 */
export async function applyRateLimit(
  request: NextRequest,
  namespace: string,
  maxPerHour: number
): Promise<Response | null> {
  if (!redis) return null;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxPerHour, "1 h"),
    analytics: false,
    prefix: `eyra:rl:${namespace}`,
  });

  const ip = clientIp(request);
  const { success } = await limiter.limit(ip);

  if (!success) {
    return Response.json(TOO_MANY_REQUESTS, { status: 429 });
  }

  return null;
}
