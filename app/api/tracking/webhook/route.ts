import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

import { lookupOrderForShipment } from "@/lib/shiprocket-store";

const MEDUSA_BASE = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/$/, "");

/**
 * Shiprocket sends its order/shipment status payload with varying field
 * names across event types and API versions, extract defensively rather
 * than assume one exact shape.
 *
 * Route path deliberately avoids the words "shiprocket"/"kartrocket"/"sr"/
 * "kr", Shiprocket's own webhook config screen warns it won't call a URL
 * containing them.
 */
interface ShiprocketWebhookPayload {
  awb?: string;
  awb_code?: string;
  order_id?: string;
  channel_order_id?: string;
  current_status?: string;
  shipment_status?: string;
  [key: string]: unknown;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

async function updateOrderShipmentStatus(
  medusaOrderId: string,
  status: string,
  awbCode: string | undefined
): Promise<void> {
  const adminKey = process.env.MEDUSA_ADMIN_API_KEY;
  if (!adminKey) return;

  try {
    await fetch(`${MEDUSA_BASE}/admin/orders/${medusaOrderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${adminKey}`,
      },
      body: JSON.stringify({
        metadata: {
          shiprocket_status: status,
          shiprocket_status_updated_at: new Date().toISOString(),
          ...(awbCode ? { awb_code: awbCode } : {}),
        },
      }),
      cache: "no-store",
    });
  } catch (err) {
    console.error(
      "[tracking/webhook] Failed to persist status for order",
      medusaOrderId,
      ":",
      err
    );
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
  if (!secret) {
    // No secret configured, refuse rather than accept unauthenticated
    // writes to order metadata.
    console.error("[tracking/webhook] SHIPROCKET_WEBHOOK_SECRET not configured, rejecting.");
    return Response.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const received = request.headers.get("x-api-key");
  if (!received || !safeEqual(received, secret)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: ShiprocketWebhookPayload;
  try {
    payload = (await request.json()) as ShiprocketWebhookPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const eyraOrderRef = payload.order_id ?? payload.channel_order_id;
  const status = payload.current_status ?? payload.shipment_status;
  const awbCode = payload.awb ?? payload.awb_code;

  if (!eyraOrderRef || !status) {
    console.warn("[tracking/webhook] Payload missing order_id/status, full body:", payload);
    return Response.json({ received: true, acted: false, reason: "missing_fields" });
  }

  const medusaOrderId = await lookupOrderForShipment(eyraOrderRef);
  if (!medusaOrderId) {
    // Either Redis isn't configured, or this shipment predates the mapping
    // being written, nothing to update, but still acknowledge receipt so
    // Shiprocket doesn't retry indefinitely.
    console.warn(
      `[tracking/webhook] No known order for reference ${eyraOrderRef}, cannot apply status "${status}".`
    );
    return Response.json({ received: true, acted: false, reason: "order_unresolved" });
  }

  await updateOrderShipmentStatus(medusaOrderId, status, awbCode);

  return Response.json({ received: true, acted: true, medusa_order_id: medusaOrderId, status });
}
