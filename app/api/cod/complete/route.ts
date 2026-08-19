import { NextRequest, NextResponse } from "next/server";
import {
  prepareCartForCheckout,
  createPaymentCollection,
  initPaymentSession,
  completeCart,
  type CheckoutShippingAddress,
} from "@/lib/medusa-order";
import { sendOrderConfirmationEmail } from "@/lib/order-email";

/**
 * Complete a Cash-on-Delivery cart into a real Medusa order.
 *
 * COD takes no upfront payment, but Medusa's cart-completion workflow still
 * requires an initialized payment session before it will produce an order —
 * `pp_system_default` (Medusa's built-in manual/no-op provider) is exactly
 * what this is for.
 */
export async function POST(req: NextRequest) {
  try {
    const { cartId, email, shippingAddress } = (await req.json()) as {
      cartId?: string;
      email?: string;
      shippingAddress?: CheckoutShippingAddress;
    };

    if (!cartId || !email || !shippingAddress) {
      return NextResponse.json(
        { error: "cartId, email, and shippingAddress are required" },
        { status: 400 }
      );
    }

    const prepared = await prepareCartForCheckout(cartId, email, shippingAddress);
    if (!prepared) {
      return NextResponse.json({ orderId: null, error: "cart_preparation_failed" }, { status: 200 });
    }

    const collectionId = await createPaymentCollection(cartId);
    if (!collectionId) {
      return NextResponse.json({ orderId: null, error: "payment_collection_failed" }, { status: 200 });
    }

    const collection = await initPaymentSession(collectionId, "pp_system_default");
    if (!collection) {
      return NextResponse.json({ orderId: null, error: "payment_session_failed" }, { status: 200 });
    }

    const { orderId } = await completeCart(cartId);
    if (!orderId) {
      return NextResponse.json({ orderId: null, error: "completion_failed" }, { status: 200 });
    }

    await sendOrderConfirmationEmail(orderId);

    return NextResponse.json({ orderId });
  } catch (err) {
    console.error("[cod/complete]", err);
    return NextResponse.json({ orderId: null, error: "internal" }, { status: 200 });
  }
}
