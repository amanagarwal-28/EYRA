"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
    </>
  );
}
