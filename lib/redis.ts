/**
 * Shared Upstash Redis client.
 *
 * Null when the Upstash env vars are absent (dev/staging without Redis) so
 * callers can degrade gracefully rather than crash.
 *
 * Configure via:
 *   UPSTASH_REDIS_REST_URL   — REST endpoint from the Upstash console
 *   UPSTASH_REDIS_REST_TOKEN — read-write token (server-only, never NEXT_PUBLIC_)
 */
import { Redis } from "@upstash/redis";

export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;
