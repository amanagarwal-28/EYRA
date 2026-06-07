import type { NextRequest } from "next/server";
import { storeConfig } from "@/config/storeConfig";

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";
const MEDUSA_BASE = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/$/, "");

/* ── Request / Response types ─────────────────────────────── */

export interface ShipmentItem {
  name: string;
  sku: string;
  type: string;       // "ring" | "chain" | "earring"
  quantity: number;
  price: number;      // unit price in rupees
}

export interface ShipmentAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
}

export interface CreateShipmentBody {
  medusaOrderId?: string;
  eyraOrderRef: string;
  paymentMethod: "prepaid" | "cod";
  shipping: ShipmentAddress;
  items: ShipmentItem[];
  subtotal: number;   // in rupees
}

export interface CreateShipmentResult {
  success: boolean;
  shipmentId: string | null;
  awbCode: string | null;
  courierName: string | null;
  error?: string;
  /** Non-fatal diagnostic — shipment was created but a background step failed (e.g. Medusa metadata write). */
  warning?: string;
}

interface ShiprocketOrderResponse {
  order_id?: number;
  shipment_id?: number;
  status?: string;
  status_code?: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
  message?: string;
}

/* ── Helpers ──────────────────────────────────────────────── */

function orderDate(): string {
  // Shiprocket expects "YYYY-MM-DD HH:MM"
  return new Date()
    .toISOString()
    .replace("T", " ")
    .slice(0, 16);
}

function itemWeightKg(type: string): number {
  const { itemWeightsG, defaultItemWeightG } = storeConfig.shipping;
  return (itemWeightsG[type] ?? defaultItemWeightG) / 1000;
}

function totalParcelWeightKg(items: ShipmentItem[]): number {
  const raw = items.reduce(
    (sum, item) => sum + itemWeightKg(item.type) * item.quantity,
    0
  );
  return Math.max(storeConfig.shipping.minChargeableWeightKg, parseFloat(raw.toFixed(3)));
}

/* ── Shiprocket order creation ────────────────────────────── */

async function createShiprocketOrder(
  body: CreateShipmentBody,
  token: string
): Promise<ShiprocketOrderResponse | null> {
  const { shipping, items, eyraOrderRef, paymentMethod, subtotal } = body;

  const payload = {
    order_id: eyraOrderRef,
    order_date: orderDate(),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION ?? "Primary",

    billing_customer_name: shipping.fullName,
    billing_address: shipping.addressLine1,
    billing_address_2: shipping.addressLine2 ?? "",
    billing_city: shipping.city,
    billing_pincode: Number(shipping.pincode),
    billing_state: shipping.state,
    billing_country: "India",
    billing_email: shipping.email,
    billing_phone: shipping.phone,
    shipping_is_billing: true,

    order_items: items.map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: storeConfig.jewelry.gstRate,
      hsn: storeConfig.jewelry.hsnCode,
    })),

    payment_method: paymentMethod === "cod" ? "COD" : "Prepaid",
    sub_total: subtotal,

    ...storeConfig.shipping.box,
    weight: totalParcelWeightKg(items),
  };

  try {
    const res = await fetch(`${SHIPROCKET_BASE}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    return (await res.json()) as ShiprocketOrderResponse;
  } catch (err) {
    console.error("[Shiprocket] createShiprocketOrder network failure for order", body.eyraOrderRef, ":", err);
    return null;
  }
}

/* ── Medusa order metadata update ─────────────────────────── */

async function persistToMedusa(
  medusaOrderId: string,
  data: { shipmentId: string; awbCode: string; courierName: string }
): Promise<string | null> {
  const adminKey = process.env.MEDUSA_ADMIN_API_KEY;
  if (!adminKey) return null;

  try {
    await fetch(`${MEDUSA_BASE}/admin/orders/${medusaOrderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-medusa-access-token": adminKey,
      },
      body: JSON.stringify({
        metadata: {
          shiprocket_shipment_id: data.shipmentId,
          awb_code: data.awbCode,
          courier_name: data.courierName,
        },
      }),
      cache: "no-store",
    });
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Medusa] persistToMedusa failed for order", medusaOrderId, "— shipment exists but metadata not written:", err);
    return `Medusa metadata write failed: ${msg}`;
  }
}

/* ── Route handler ────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const token = process.env.SHIPROCKET_API_TOKEN;

  let body: Partial<CreateShipmentBody>;
  try {
    body = (await request.json()) as Partial<CreateShipmentBody>;
  } catch (err) {
    console.warn("[create-shipment] Failed to parse request body:", err);
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { medusaOrderId, eyraOrderRef, paymentMethod, shipping, items, subtotal } = body;

  if (!eyraOrderRef || !paymentMethod || !shipping || !items?.length || subtotal == null) {
    return Response.json(
      { error: "Missing required fields: eyraOrderRef, paymentMethod, shipping, items, subtotal." },
      { status: 400 }
    );
  }

  // Shiprocket not configured — return a graceful no-op so checkout is not blocked.
  if (!token) {
    const result: CreateShipmentResult = {
      success: false,
      shipmentId: null,
      awbCode: null,
      courierName: null,
      error: "SHIPROCKET_API_TOKEN not configured.",
    };
    return Response.json(result);
  }

  const srResponse = await createShiprocketOrder(
    { medusaOrderId, eyraOrderRef, paymentMethod, shipping, items, subtotal },
    token
  );

  if (!srResponse || srResponse.status_code === undefined) {
    const result: CreateShipmentResult = {
      success: false,
      shipmentId: null,
      awbCode: null,
      courierName: null,
      error: "Shiprocket API returned an unexpected response.",
    };
    return Response.json(result);
  }

  const shipmentId = srResponse.shipment_id ? String(srResponse.shipment_id) : null;
  const awbCode = srResponse.awb_code ?? null;
  const courierName = srResponse.courier_name ?? null;

  // Persist tracking data back to Medusa order metadata.
  let persistWarning: string | null = null;
  if (medusaOrderId && shipmentId) {
    persistWarning = await persistToMedusa(medusaOrderId, {
      shipmentId,
      awbCode: awbCode ?? "",
      courierName: courierName ?? "",
    });
    // NOTE: To also write tracking_number + courier_name into eyra_order,
    // install `pg` and `@types/pg`, then run:
    //   UPDATE eyra_order
    //   SET tracking_number = $1, courier_name = $2,
    //       fulfillment_status = 'fulfillment_created', shipped_at = NOW()
    //   WHERE medusa_order_id = $3
    // using process.env.DATABASE_URL as the connection string.
  }

  const result: CreateShipmentResult = {
    success: true,
    shipmentId,
    awbCode,
    courierName,
    ...(persistWarning ? { warning: persistWarning } : {}),
  };
  return Response.json(result);
}
