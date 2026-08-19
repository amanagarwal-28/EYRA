/**
 * Server-only: Medusa cart → order completion.
 *
 * Shared by the two independent confirmation paths for a prepaid order:
 *   - /api/razorpay/verify   (client redirect, fast path)
 *   - /api/razorpay/webhook  (Razorpay callback, guaranteed path)
 *
 * Both must produce exactly one order, so completion lives here rather than
 * being duplicated per route.
 */
import "server-only";

const BASE_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/$/, "");

const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

function storeHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(PUB_KEY ? { "x-publishable-api-key": PUB_KEY } : {}),
  };
}

/* ── Cart snapshot ────────────────────────────────────────── */

interface RawCartResponse {
  cart?: {
    id: string;
    total: number;
    currency_code: string;
    completed_at?: string | null;
  };
}

export interface CartSnapshot {
  id: string;
  /** Total in rupees (Medusa v2 stores/returns major units, not paise). */
  total: number;
  currencyCode: string;
  /** Set once the cart has become an order; null while the cart is still open. */
  completedAt: string | null;
}

/**
 * Read a cart without mutating it. Used by the webhook to check whether the
 * cart was already completed by the client path and to compare the paid amount
 * against what the cart actually owes.
 *
 * Returns null when the cart is unknown or the backend is unreachable — the
 * caller cannot distinguish these, so treat null as "retry later".
 */
export async function fetchCartSnapshot(cartId: string): Promise<CartSnapshot | null> {
  try {
    const res = await fetch(`${BASE_URL}/store/carts/${cartId}`, {
      headers: storeHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[medusa-order] cart fetch ${res.status} ${res.statusText} — ${cartId}`);
      return null;
    }

    const data = (await res.json()) as RawCartResponse;
    if (!data.cart) return null;

    return {
      id: data.cart.id,
      total: data.cart.total,
      currencyCode: data.cart.currency_code,
      completedAt: data.cart.completed_at ?? null,
    };
  } catch (err) {
    console.error("[medusa-order] cart fetch error for", cartId, ":", err);
    return null;
  }
}

/* ── Completion ───────────────────────────────────────────── */

interface MedusaCompleteResponse {
  type: "order" | "cart" | "swap";
  order?: { id: string; display_id?: number };
}

export interface CompleteCartOutcome {
  /** The Medusa order ID, or null when completion did not produce an order. */
  orderId: string | null;
  /**
   * True when the failure looks transient (network error, 5xx, 429) and the
   * caller should ask Razorpay to redeliver. False for permanent conditions —
   * retrying those just burns the retry budget.
   */
  retryable: boolean;
}

/**
 * Turn a Medusa cart into a confirmed order.
 *
 * Call only after the payment has been cryptographically verified.
 */
export async function completeCart(cartId: string): Promise<CompleteCartOutcome> {
  try {
    const res = await fetch(`${BASE_URL}/store/carts/${cartId}/complete`, {
      method: "POST",
      headers: storeHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(
        `[medusa-order] complete ${res.status} ${res.statusText} — cart ${cartId}`
      );
      return { orderId: null, retryable: res.status >= 500 || res.status === 429 };
    }

    const data = (await res.json()) as MedusaCompleteResponse;

    if (data.type === "order" && data.order?.id) {
      return { orderId: data.order.id, retryable: false };
    }

    // Medusa returned the cart instead of an order — usually a validation
    // failure (out of stock, no shipping method). Retrying will not fix it.
    console.error(
      `[medusa-order] complete returned type "${data.type}" instead of an order — cart ${cartId}`
    );
    return { orderId: null, retryable: false };
  } catch (err) {
    console.error("[medusa-order] complete error for cart", cartId, ":", err);
    return { orderId: null, retryable: true };
  }
}
