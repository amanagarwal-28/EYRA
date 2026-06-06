import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

interface VerifyBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  medusa_cart_id: string;
}

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // Hard failure — operating without a secret means signatures can never be
    // verified, so no payment should be accepted.
    throw new Error("RAZORPAY_KEY_SECRET is not configured on this server.");
  }

  let body: Partial<VerifyBody>;
  try {
    body = (await request.json()) as Partial<VerifyBody>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, medusa_cart_id } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !medusa_cart_id) {
    return Response.json(
      { error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature, medusa_cart_id." },
      { status: 400 }
    );
  }

  // Razorpay's signing scheme: HMAC-SHA256 of "order_id|payment_id"
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedHex = createHmac("sha256", secret).update(payload).digest("hex");

  // Timing-safe comparison prevents timing-oracle attacks on the HMAC check.
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(razorpay_signature, "hex");

  const signatureValid =
    expected.length === received.length &&
    timingSafeEqual(expected, received);

  if (!signatureValid) {
    return Response.json(
      { error: "Payment signature verification failed. Transaction rejected." },
      { status: 400 }
    );
  }

  return Response.json({
    verified: true,
    razorpay_payment_id,
    razorpay_order_id,
    medusa_cart_id,
  });
}
