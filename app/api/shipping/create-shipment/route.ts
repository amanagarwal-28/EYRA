import type { NextRequest } from "next/server";

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";
const MEDUSA_BASE = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/$/, "");

// Jewelry HSN code: 7113 — Articles of jewelry of precious metal (BIS standard)
const JEWELRY_HSN = "7113";
// GST rate for silver jewelry (3%)
const GST_PERCENT = 3;

// Manufacturing weight thresholds per product category (grams)
const ITEM_WEIGHT_G: Record<string, number> = {
  ring: 6,      // lightweight cast rings stay under 6 g
  earring: 6,   // stud/hoop pairs under 6 g
  chain: 15,    // chains and necklaces up to 15 g
};
const DEFAULT_ITEM_WEIGHT_G = 10;

// Shiprocket minimum chargeable weight slab (kg)
const MIN_SHIP_WEIGHT_KG = 0.5;

// Standard jewellery box dimensions (cm)
const BOX = { length: 10, breadth: 8, height: 3 };

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
  return (ITEM_WEIGHT_G[type] ?? DEFAULT_ITEM_WEIGHT_G) / 1000;
}

function totalParcelWeightKg(items: ShipmentItem[]): number {
  const raw = items.reduce(
    (sum, item) => sum + itemWeightKg(item.type) * item.quantity,
    0
  );
  // Enforce Shiprocket's minimum chargeable slab
  return Math.max(MIN_SHIP_WEIGHT_KG, parseFloat(raw.toFixed(3)));
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
      tax: GST_PERCENT,
      hsn: JEWELRY_HSN,
    })),

    payment_method: paymentMethod === "cod" ? "COD" : "Prepaid",
    sub_total: subtotal,

    ...BOX,
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
  } catch {
    return null;
  }
}

/* ── Medusa order metadata update ─────────────────────────── */

async function persistToMedusa(
  medusaOrderId: string,
  data: { shipmentId: string; awbCode: string; courierName: string }
): Promise<void> {
  const adminKey = process.env.MEDUSA_ADMIN_API_KEY;
  if (!adminKey) return;

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
  } catch {
    // Non-fatal: shipment is created; metadata persistence can be retried.
  }
}

/* ── Route handler ────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const token = process.env.SHIPROCKET_API_TOKEN;

  let body: Partial<CreateShipmentBody>;
  try {
    body = (await request.json()) as Partial<CreateShipmentBody>;
  } catch {
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

  // Persist tracking data back to Medusa order metadata in the background.
  if (medusaOrderId && shipmentId) {
    void persistToMedusa(medusaOrderId, {
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
  };
  return Response.json(result);
}
