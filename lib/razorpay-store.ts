/**
 * Server-only: durable bookkeeping for the Razorpay payment path.
 *
 * Two responsibilities:
 *
 *   1. razorpay_order_id → medusa_cart_id mapping, written server-side at
 *      order-creation time. The webhook needs this because Razorpay's callback
 *      carries no Medusa identifiers of its own, and anything the *browser*
 *      supplies (checkout `notes`) is attacker-controlled.
 *
 *   2. Payment-level idempotency. Razorpay retries webhooks on any non-2xx and
 *      can legitimately deliver both `payment.captured` and `order.paid` for a
 *      single payment, so the handler must be safe to run repeatedly.
 *
 * Every function degrades to a no-op when Upstash is not configured, the
 * webhook then falls back to Medusa's own `completed_at` check for idempotency.
 */
import "server-only";

import { redis } from "@/lib/redis";

/** Carts outlive a checkout session but not indefinitely. */
const CART_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** Keep processed payment IDs well past Razorpay's retry window. */
const PAYMENT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const cartKey = (razorpayOrderId: string) => `eyra:rzp:cart:${razorpayOrderId}`;
const paymentKey = (paymentId: string) => `eyra:rzp:payment:${paymentId}`;

/* ── Cart mapping ─────────────────────────────────────────── */

/**
 * Bind a Razorpay order to the Medusa cart it was created from.
 * Called from /api/razorpay/create-order, where both IDs are known and both
 * are server-derived.
 */
export async function rememberCartForRazorpayOrder(
  razorpayOrderId: string,
  cartId: string
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(cartKey(razorpayOrderId), cartId, { ex: CART_TTL_SECONDS });
  } catch (err) {
    // Non-fatal: checkout still works, but the webhook will have to fall back
    // to the (untrusted) notes path for this payment.
    console.error(
      "[razorpay-store] Failed to persist cart mapping for",
      razorpayOrderId,
      "webhook recovery for this order will be degraded:",
      err
    );
  }
}

/** Resolve the Medusa cart for a Razorpay order. Null when unknown. */
export async function lookupCartForRazorpayOrder(
  razorpayOrderId: string
): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get<string>(cartKey(razorpayOrderId));
  } catch (err) {
    console.error("[razorpay-store] Cart mapping lookup failed for", razorpayOrderId, ":", err);
    return null;
  }
}

/* ── Payment idempotency ──────────────────────────────────── */

export type PaymentClaim =
  /** This process now owns the payment and should proceed. */
  | "claimed"
  /** Another delivery already handled it, the caller must not act again. */
  | "already_processed"
  /** No Redis configured; caller must rely on a secondary idempotency check. */
  | "unavailable";

/**
 * Atomically claim a payment ID for processing (SET NX).
 *
 * Release the claim via `releasePayment` on any path that did NOT reach a
 * terminal outcome, otherwise a transient Medusa outage would permanently
 * swallow the order, Razorpay's retry would be deduped against a claim that
 * never resulted in a completed cart.
 */
export async function claimPayment(paymentId: string): Promise<PaymentClaim> {
  if (!redis) return "unavailable";
  try {
    const result = await redis.set(paymentKey(paymentId), new Date().toISOString(), {
      nx: true,
      ex: PAYMENT_TTL_SECONDS,
    });
    return result === "OK" ? "claimed" : "already_processed";
  } catch (err) {
    console.error("[razorpay-store] Idempotency claim failed for", paymentId, ":", err);
    return "unavailable";
  }
}

/** Release a claim so a Razorpay retry (or manual replay) can try again. */
export async function releasePayment(paymentId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(paymentKey(paymentId));
  } catch (err) {
    console.error(
      "[razorpay-store] Failed to release idempotency claim for", paymentId,
      "retries of this webhook will be deduped and the order may need manual completion:",
      err
    );
  }
}
