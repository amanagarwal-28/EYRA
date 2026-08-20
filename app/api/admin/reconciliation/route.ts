import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/**
 * Payment settlement reconciliation, cross-checks Razorpay's own record of
 * captured payments against Medusa orders, so a payment that Razorpay
 * captured but that never became a real order (or vice versa) doesn't sit
 * silently unnoticed.
 *
 * Protected by a shared secret rather than customer auth, since this exposes
 * financial data across all customers, not just the caller's own.
 *
 * Usage: GET /api/admin/reconciliation?from=2026-08-01&to=2026-08-31
 *   -H "x-admin-secret: $RECONCILIATION_SECRET"
 */

const MEDUSA_BASE = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/$/, "");

interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number; // paise
  currency: string;
  status: string;
  created_at: number; // unix seconds
}

interface RazorpayPaymentsResponse {
  count: number;
  items: RazorpayPayment[];
}

interface MedusaOrderSummary {
  id: string;
  display_id: number;
  total: number; // rupees
  created_at: string;
  metadata: { razorpay_payment_id?: string; razorpay_order_id?: string } | null;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

async function fetchAllRazorpayPayments(fromUnix: number, toUnix: number): Promise<RazorpayPayment[]> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const all: RazorpayPayment[] = [];
  let skip = 0;
  const count = 100;

  // Razorpay caps a single page at 100, loop until a short page tells us we're done.
  for (let page = 0; page < 50; page++) {
    const url = new URL("https://api.razorpay.com/v1/payments");
    url.searchParams.set("from", String(fromUnix));
    url.searchParams.set("to", String(toUnix));
    url.searchParams.set("count", String(count));
    url.searchParams.set("skip", String(skip));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[reconciliation] Razorpay payments fetch ${res.status}`);
      break;
    }
    const data = (await res.json()) as RazorpayPaymentsResponse;
    all.push(...data.items);
    if (data.items.length < count) break;
    skip += count;
  }

  return all;
}

async function fetchAllMedusaOrders(fromIso: string, toIso: string): Promise<MedusaOrderSummary[]> {
  const key = process.env.MEDUSA_ADMIN_API_KEY ?? "";
  const all: MedusaOrderSummary[] = [];
  let offset = 0;
  const limit = 100;

  for (let page = 0; page < 50; page++) {
    const url = new URL(`${MEDUSA_BASE}/admin/orders`);
    url.searchParams.set("created_at[$gte]", fromIso);
    url.searchParams.set("created_at[$lte]", toIso);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("fields", "id,display_id,total,metadata,created_at");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Basic ${key}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[reconciliation] Medusa orders fetch ${res.status}`);
      break;
    }
    const data = (await res.json()) as { orders: MedusaOrderSummary[]; count: number };
    all.push(...data.orders);
    if (offset + limit >= data.count) break;
    offset += limit;
  }

  return all;
}

export async function GET(request: NextRequest) {
  const configuredSecret = process.env.RECONCILIATION_SECRET;
  if (!configuredSecret) {
    return Response.json({ error: "Reconciliation is not configured." }, { status: 503 });
  }

  const received = request.headers.get("x-admin-secret");
  if (!received || !safeEqual(received, configuredSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.MEDUSA_ADMIN_API_KEY) {
    return Response.json({ error: "MEDUSA_ADMIN_API_KEY is not configured." }, { status: 503 });
  }
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return Response.json({ error: "RAZORPAY_KEY_SECRET is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = searchParams.get("from") ?? defaultFrom.toISOString().slice(0, 10);
  const to = searchParams.get("to") ?? now.toISOString().slice(0, 10);

  const fromUnix = Math.floor(new Date(`${from}T00:00:00Z`).getTime() / 1000);
  const toUnix = Math.floor(new Date(`${to}T23:59:59Z`).getTime() / 1000);

  const [payments, orders] = await Promise.all([
    fetchAllRazorpayPayments(fromUnix, toUnix),
    fetchAllMedusaOrders(`${from}T00:00:00Z`, `${to}T23:59:59Z`),
  ]);

  const capturedPayments = payments.filter((p) => p.status === "captured");
  const ordersByPaymentId = new Map<string, MedusaOrderSummary>();
  for (const order of orders) {
    const paymentId = order.metadata?.razorpay_payment_id;
    if (paymentId) ordersByPaymentId.set(paymentId, order);
  }

  const orphanedPayments: Array<{
    razorpay_payment_id: string;
    razorpay_order_id: string | null;
    amount_rupees: number;
    captured_at: string;
  }> = [];
  const amountMismatches: Array<{
    razorpay_payment_id: string;
    medusa_order_id: string;
    display_id: number;
    razorpay_amount_rupees: number;
    medusa_order_total_rupees: number;
  }> = [];

  for (const payment of capturedPayments) {
    const order = ordersByPaymentId.get(payment.id);
    const paidRupees = payment.amount / 100;

    if (!order) {
      orphanedPayments.push({
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        amount_rupees: paidRupees,
        captured_at: new Date(payment.created_at * 1000).toISOString(),
      });
      continue;
    }

    if (Math.round(paidRupees) !== Math.round(order.total)) {
      amountMismatches.push({
        razorpay_payment_id: payment.id,
        medusa_order_id: order.id,
        display_id: order.display_id,
        razorpay_amount_rupees: paidRupees,
        medusa_order_total_rupees: order.total,
      });
    }
  }

  return Response.json({
    range: { from, to },
    summary: {
      razorpay_captured_payments: capturedPayments.length,
      medusa_orders_with_payment_link: ordersByPaymentId.size,
      matched: capturedPayments.length - orphanedPayments.length,
      orphaned_payments: orphanedPayments.length,
      amount_mismatches: amountMismatches.length,
    },
    orphaned_payments: orphanedPayments,
    amount_mismatches: amountMismatches,
  });
}
