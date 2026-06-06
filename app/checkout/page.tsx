import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase with secure checkout.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
