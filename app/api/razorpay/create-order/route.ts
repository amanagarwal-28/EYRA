import { NextRequest, NextResponse } from "next/server";

const BASE_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/$/, "");

const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  ...(PUB_KEY ? { "x-publishable-api-key": PUB_KEY } : {}),
};

interface MedusaPaymentSession {
  id: string;
  provider_id: string;
  data: Record<string, unknown>;
}

interface MedusaPaymentCollection {
  id: string;
  amount: number;
  payment_sessions?: MedusaPaymentSession[];
}

async function createPaymentCollection(cartId: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/store/carts/${cartId}/payment-collection`, {
    method: "POST",
    headers,
  });
  if (!res.ok) return null;
  const body = await res.json();
  // Medusa v2 returns { cart: { payment_collection: { id } } }
  return (
    body?.cart?.payment_collection?.id ??
    body?.payment_collection?.id ??
    null
  );
}

async function initPaymentSession(
  collectionId: string
): Promise<MedusaPaymentCollection | null> {
  const res = await fetch(
    `${BASE_URL}/store/payment-collections/${collectionId}/payment-sessions`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ provider_id: "pp_razorpay_razorpay" }),
    }
  );
  if (!res.ok) return null;
  const body = await res.json();
  return body?.payment_collection ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const { cartId } = (await req.json()) as { cartId?: string };

    if (!cartId) {
      return NextResponse.json({ error: "cartId is required" }, { status: 400 });
    }

    // Step 1 — create (or reuse) the payment collection for this cart
    const collectionId = await createPaymentCollection(cartId);

    if (!collectionId) {
      return NextResponse.json(
        { razorpayOrderId: null, error: "payment_collection_failed" },
        { status: 200 }
      );
    }

    // Step 2 — initialize a Razorpay payment session on the collection
    const collection = await initPaymentSession(collectionId);
    const session = collection?.payment_sessions?.find(
      (s) => s.provider_id === "pp_razorpay_razorpay"
    );

    // `session.data.id` is the Razorpay order_id (e.g. "order_NbEkof23W")
    const razorpayOrderId =
      typeof session?.data?.id === "string" ? session.data.id : null;

    return NextResponse.json({
      razorpayOrderId,
      collectionId,
      sessionId: session?.id ?? null,
    });
  } catch (err) {
    console.error("[razorpay/create-order]", err);
    // Non-critical — frontend will fall back to amount-only checkout
    return NextResponse.json({ razorpayOrderId: null, error: "internal" }, { status: 200 });
  }
}
