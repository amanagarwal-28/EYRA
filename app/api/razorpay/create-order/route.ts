import { NextRequest, NextResponse } from "next/server";
import { rememberCartForRazorpayOrder } from "@/lib/razorpay-store";
import {
  prepareCartForCheckout,
  createPaymentCollection,
  initPaymentSession,
  type CheckoutShippingAddress,
} from "@/lib/medusa-order";

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

    // Step 1 — set email/shipping address and select a shipping method.
    // Required before Medusa will allow the cart to complete.
    const prepared = await prepareCartForCheckout(cartId, email, shippingAddress);
    if (!prepared) {
      return NextResponse.json(
        { razorpayOrderId: null, error: "cart_preparation_failed" },
        { status: 200 }
      );
    }

    // Step 2 — create (or reuse) the payment collection for this cart
    const collectionId = await createPaymentCollection(cartId);

    if (!collectionId) {
      return NextResponse.json(
        { razorpayOrderId: null, error: "payment_collection_failed" },
        { status: 200 }
      );
    }

    // Step 3 — initialize a Razorpay payment session on the collection
    const collection = await initPaymentSession(collectionId, "pp_razorpay_razorpay");
    const session = collection?.payment_sessions?.find(
      (s) => s.provider_id === "pp_razorpay_razorpay"
    );

    // `session.data.id` is the Razorpay order_id (e.g. "order_NbEkof23W")
    const razorpayOrderId =
      typeof session?.data?.id === "string" ? session.data.id : null;

    // Bind the Razorpay order to this cart while both IDs are server-derived.
    // /api/razorpay/webhook relies on this to recover an order when the
    // customer's browser never makes it back to /api/razorpay/verify.
    if (razorpayOrderId) {
      await rememberCartForRazorpayOrder(razorpayOrderId, cartId);
    }

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
