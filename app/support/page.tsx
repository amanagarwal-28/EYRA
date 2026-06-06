import type { Metadata } from "next";
import { SupportClient } from "@/components/support/SupportClient";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with orders, shipping, returns, and anything else you need.",
};

export default function SupportPage() {
  return <SupportClient />;
}
