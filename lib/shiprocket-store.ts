/**
 * Server-only: durable bookkeeping for the Shiprocket webhook.
 *
 * Shiprocket's status-update webhook only carries back whatever `order_id`
 * we originally sent when creating the shipment (eyraOrderRef, a friendly,
 * client-generated string) and the AWB code. Neither of those is a Medusa
 * order ID, and Medusa's Admin API has no reliable way to search orders by
 * metadata, so without this mapping there is no way to resolve an incoming
 * webhook back to the order it belongs to.
 *
 * Degrades to a no-op when Upstash isn't configured, the webhook then has
 * no way to resolve the order and safely does nothing.
 */
import "server-only";

import { redis } from "@/lib/redis";

const MAPPING_TTL_SECONDS = 60 * 60 * 24 * 60; // 60 days, covers slow RTOs

const orderKey = (eyraOrderRef: string) => `eyra:shiprocket:order:${eyraOrderRef}`;

/**
 * Bind a Shiprocket shipment's order reference to the Medusa order it
 * belongs to. Called right after shipment creation, where both IDs are
 * known.
 */
export async function rememberOrderForShipment(
  eyraOrderRef: string,
  medusaOrderId: string
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(orderKey(eyraOrderRef), medusaOrderId, { ex: MAPPING_TTL_SECONDS });
  } catch (err) {
    console.error(
      "[shiprocket-store] Failed to persist order mapping for",
      eyraOrderRef,
      "webhook status updates for this shipment will be dropped:",
      err
    );
  }
}

/** Resolve the Medusa order for a Shiprocket order reference. Null when unknown. */
export async function lookupOrderForShipment(eyraOrderRef: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get<string>(orderKey(eyraOrderRef));
  } catch (err) {
    console.error("[shiprocket-store] Order mapping lookup failed for", eyraOrderRef, ":", err);
    return null;
  }
}
