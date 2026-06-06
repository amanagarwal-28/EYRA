import type { Metadata } from "next";
import { WishlistClient } from "@/components/wishlist/WishlistClient";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your saved items — jewellery you love.",
};

export default function WishlistPage() {
  return <WishlistClient />;
}
