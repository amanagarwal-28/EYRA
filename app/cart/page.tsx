import type { Metadata } from "next";
import { CartClient } from "@/components/cart/CartClient";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your cart and proceed to checkout.",
};

export default function CartPage() {
  return <CartClient />;
}
