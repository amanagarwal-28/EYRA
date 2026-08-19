/**
 * Server-only: order-confirmation email, sent exactly once per order.
 *
 * Called after every successful cart completion (COD, and both the prepaid
 * verify/webhook paths). Idempotency is tracked via order.metadata since
 * prepaid orders can legitimately be completed by either the fast (verify)
 * or guaranteed (webhook) path, and a rare race between the two could
 * otherwise trigger a duplicate email.
 */
import "server-only";

import { sendEmail } from "@/lib/email";

const BASE_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/$/, "");

const ADMIN_KEY = process.env.MEDUSA_ADMIN_API_KEY ?? "";

interface OrderItemForEmail {
  title: string;
  quantity: number;
  unit_price: number;
}

interface OrderForEmail {
  id: string;
  display_id: number;
  email: string | null;
  total: number;
  metadata: Record<string, unknown> | null;
  items: OrderItemForEmail[];
}

function adminHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${ADMIN_KEY}`,
  };
}

async function fetchOrderForEmail(orderId: string): Promise<OrderForEmail | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/admin/orders/${orderId}?fields=id,display_id,email,total,metadata,items.title,items.quantity,items.unit_price`,
      { headers: adminHeaders(), cache: "no-store" }
    );
    if (!res.ok) {
      console.error(`[order-email] order fetch ${res.status} — ${orderId}`);
      return null;
    }
    const data = (await res.json()) as { order?: OrderForEmail };
    return data.order ?? null;
  } catch (err) {
    console.error("[order-email] order fetch failed for", orderId, ":", err);
    return null;
  }
}

async function markConfirmationEmailSent(orderId: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/admin/orders/${orderId}`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ metadata: { confirmation_email_sent: true } }),
    });
  } catch (err) {
    // Non-fatal: worst case is a duplicate email if this order is somehow
    // completed again, which the caller-side idempotency mostly prevents.
    console.error("[order-email] failed to mark sent for", orderId, ":", err);
  }
}

function renderOrderEmail(order: OrderForEmail): string {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            ${item.title} × ${item.quantity}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">
            ₹${Math.round(item.unit_price * item.quantity).toLocaleString("en-IN")}
          </td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a;">
      <h1 style="font-weight:300;letter-spacing:4px;font-size:20px;margin-bottom:24px;">EYRA</h1>
      <h2 style="font-weight:500;font-size:18px;">Order Confirmed</h2>
      <p style="color:#555;font-size:14px;">
        Thank you for your order — here's a summary of what's on its way.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
        ${rows}
      </table>
      <table style="width:100%;margin-top:12px;font-size:15px;font-weight:600;">
        <tr>
          <td>Total</td>
          <td style="text-align:right;">₹${Math.round(order.total).toLocaleString("en-IN")}</td>
        </tr>
      </table>
      <p style="color:#888;font-size:13px;margin-top:24px;">
        Order #${order.display_id} · Each piece is handcrafted within 7–10 business days.
      </p>
    </div>
  `;
}

export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  if (!ADMIN_KEY) return;

  const order = await fetchOrderForEmail(orderId);
  if (!order || !order.email) return;
  if (order.metadata?.confirmation_email_sent) return;

  const sent = await sendEmail({
    to: order.email,
    subject: `Your EYRA order #${order.display_id} is confirmed`,
    html: renderOrderEmail(order),
    from: process.env.ORDER_EMAIL_FROM ?? "EYRA Orders <orders@eyra.org.in>",
  });

  if (sent) await markConfirmationEmailSent(orderId);
}
