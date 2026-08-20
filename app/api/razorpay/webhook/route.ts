/**
 * Razorpay webhook — the guaranteed confirmation path.
 *
 * /api/razorpay/verify only runs if the customer's browser survives long enough
 * to call it. When the modal is closed early, the tab dies, or the network drops
 * after capture, the money moves and no order is ever created. This endpoint
 * closes that gap: Razorpay delivers the event server-to-server and retries on
 * any non-2xx response.
 *
 * Configure in the Razorpay dashboard (Settings → Webhooks):
 *   URL     https://<your-domain>/api/razorpay/webhook
 *   Events  payment.captured, payment.failed, order.paid
 *   Secret  → RAZORPAY_WEBHOOK_SECRET (distinct from RAZORPAY_KEY_SECRET)
 *
 * NOTE: this handler completes the order only. Shiprocket shipment creation
 * still happens exclusively on the client path in CheckoutClient, so an order
 * recovered here will have no AWB until it is dispatched from Medusa admin.
 * Wiring dispatch in here needs a guard against duplicate shipments first.
 */
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

import { completeCart, fetchCartSnapshot, persistRazorpayPaymentId } from "@/lib/medusa-order";
import { sendOrderConfirmationEmail } from "@/lib/order-email";
import {
  claimPayment,
  lookupCartForRazorpayOrder,
  releasePayment,
} from "@/lib/razorpay-store";

// Signature verification needs node:crypto and the unbuffered request body.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ── Razorpay event shapes ────────────────────────────────── */

interface RazorpayPaymentEntity {
  id: string;
  order_id: string | null;
  /** Amount actually paid, in the smallest currency unit (paise). */
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string> | null;
  error_description?: string | null;
}

interface RazorpayOrderEntity {
  id: string;
  amount: number;
  notes?: Record<string, string> | null;
}

interface RazorpayWebhookEvent {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    order?: { entity?: RazorpayOrderEntity };
  };
}

/** How the cart ID was resolved — determines how much we trust it. */
type CartSource = "mapping" | "notes";

/* ── Signature verification ───────────────────────────────── */

/**
 * Razorpay signs the raw request body with the webhook secret (HMAC-SHA256,
 * hex). The body must be hashed exactly as received — re-serialising parsed
 * JSON reorders keys and breaks the digest.
 */
function signatureValid(rawBody: string, received: string, secret: string): boolean {
  const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex");

  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(received, "hex");

  // Buffer.from silently truncates malformed hex, so compare lengths first.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* ── Route handler ────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[EYRA Security] RAZORPAY_WEBHOOK_SECRET is not configured — webhook events cannot be authenticated and are being rejected."
    );
    return Response.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const receivedSignature = request.headers.get("x-razorpay-signature");

  if (!receivedSignature) {
    console.error("[EYRA Security] Webhook request arrived with no x-razorpay-signature header.");
    return Response.json({ error: "Missing signature." }, { status: 400 });
  }

  if (!signatureValid(rawBody, receivedSignature, secret)) {
    console.error(
      "[EYRA Security] Webhook signature verification FAILED — request rejected. " +
      "This is either a misconfigured secret or a forged delivery."
    );
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const eventName = event.event ?? "unknown";
  const payment = event.payload?.payment?.entity;

  /* ── Events we don't act on ─────────────────────────────── */

  if (eventName === "payment.failed") {
    console.warn(
      "[razorpay/webhook] Payment failed —",
      `payment: ${payment?.id ?? "unknown"},`,
      `order: ${payment?.order_id ?? "unknown"},`,
      `reason: ${payment?.error_description ?? "not provided"}`
    );
    return Response.json({ received: true, acted: false });
  }

  if (eventName !== "payment.captured" && eventName !== "order.paid") {
    return Response.json({ received: true, acted: false, ignored: eventName });
  }

  if (!payment?.id) {
    console.error(`[razorpay/webhook] "${eventName}" carried no payment entity — cannot process.`);
    return Response.json({ received: true, acted: false, reason: "no_payment_entity" });
  }

  /* ── Idempotency ────────────────────────────────────────── */

  // Razorpay sends both payment.captured and order.paid for a single payment,
  // and redelivers on any non-2xx. Only one of those may complete the cart.
  const claim = await claimPayment(payment.id);
  if (claim === "already_processed") {
    return Response.json({ received: true, acted: false, deduped: true });
  }

  /* ── Resolve the Medusa cart ────────────────────────────── */

  // Preferred: the server-written mapping from /api/razorpay/create-order.
  // Fallback: checkout notes, which originate in the browser and are therefore
  // attacker-controlled — that path gets an extra amount check below.
  let cartId: string | null = payment.order_id
    ? await lookupCartForRazorpayOrder(payment.order_id)
    : null;
  let cartSource: CartSource = "mapping";

  if (!cartId) {
    cartId =
      payment.notes?.medusa_cart_id ??
      event.payload?.order?.entity?.notes?.medusa_cart_id ??
      null;
    cartSource = "notes";
  }

  if (!cartId) {
    console.error(
      "[EYRA Security] MANUAL RECONCILIATION REQUIRED — payment captured but no Medusa cart could be resolved. " +
      `payment: ${payment.id}, razorpay_order: ${payment.order_id ?? "none"}, ` +
      `amount: ₹${payment.amount / 100}.`
    );
    await releasePayment(payment.id);
    return Response.json({ received: true, acted: false, reason: "cart_unresolved" });
  }

  /* ── Pre-flight checks ──────────────────────────────────── */

  const snapshot = await fetchCartSnapshot(cartId);

  if (!snapshot) {
    // Unknown cart or unreachable backend — indistinguishable here, so let
    // Razorpay redeliver rather than dropping a captured payment.
    console.error(
      `[razorpay/webhook] Could not read cart ${cartId} for payment ${payment.id} — requesting redelivery.`
    );
    await releasePayment(payment.id);
    return Response.json({ error: "Cart unavailable." }, { status: 500 });
  }

  if (snapshot.completedAt) {
    // The client path already got there. This is the normal outcome for a
    // healthy checkout, and it is also our idempotency backstop when Redis
    // is not configured.
    return Response.json({ received: true, acted: false, alreadyCompleted: true });
  }

  // Only enforced on the untrusted resolution path: without it, a spoofed
  // `notes.medusa_cart_id` could point a small payment at an expensive cart.
  // Razorpay reports payment.amount in paise; snapshot.total is in rupees.
  if (cartSource === "notes" && snapshot.total * 100 !== payment.amount) {
    console.error(
      "[EYRA Security] TRANSACTION BLOCKED — amount mismatch on notes-resolved cart. " +
      `payment: ${payment.id}, paid: ₹${payment.amount / 100}, cart ${cartId} owes: ₹${snapshot.total}. ` +
      "Cart was NOT completed."
    );
    await releasePayment(payment.id);
    return Response.json({ received: true, acted: false, reason: "amount_mismatch" });
  }

  /* ── Complete the order ─────────────────────────────────── */

  const { orderId, retryable } = await completeCart(cartId);

  if (!orderId) {
    // Release the claim either way so a redelivery or manual replay can retry
    // once the underlying problem (stock, shipping method, backend) is fixed.
    await releasePayment(payment.id);

    if (retryable) {
      return Response.json({ error: "Order completion failed." }, { status: 500 });
    }

    console.error(
      "[EYRA Security] MANUAL RECONCILIATION REQUIRED — payment captured but cart completion was rejected. " +
      `payment: ${payment.id}, cart: ${cartId}, amount: ₹${payment.amount / 100}.`
    );
    return Response.json({ received: true, acted: false, reason: "completion_rejected" });
  }

  console.info(
    `[razorpay/webhook] Recovered order via ${eventName} — ` +
    `medusa_order: ${orderId}, payment: ${payment.id}, cart resolved via ${cartSource}.`
  );

  await persistRazorpayPaymentId(orderId, payment.order_id ?? "", payment.id);
  await sendOrderConfirmationEmail(orderId);

  return Response.json({ received: true, acted: true, medusa_order_id: orderId });
}
