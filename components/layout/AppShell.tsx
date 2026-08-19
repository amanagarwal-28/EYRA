"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartSyncBanner } from "./CartSyncBanner";
import { useCartStore, useWishlistStore } from "@/store/useStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initCart = useCartStore((s) => s.initCart);
  const initWishlist = useWishlistStore((s) => s.initWishlist);

  useEffect(() => {
    initCart();
    initWishlist();
  }, [initCart, initWishlist]);
  const isAuth =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  if (isAuth) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className="flex-1" style={{ paddingTop: "var(--nav-height)" }}>
        {children}
      </main>
      <Footer />
      <CartSyncBanner />
    </>
  );
}
