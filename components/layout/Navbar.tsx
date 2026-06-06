"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, ShoppingBag, User, Heart } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useCartStore } from "@/store/useStore";
import { useWishlistStore } from "@/store/useStore";

const NAV_ITEMS = [
  { label: "Collections", href: "/collections" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "About",       href: "/about"        },
  { label: "Contact",     href: "/contact"      },
] as const;

export function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  /* Prevent body scroll while mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* ── Fixed top bar ─────────────────────────────── */}
      <header
        className={[
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          isHome
            ? scrolled
              ? "bg-charcoal/95 backdrop-blur-md border-b border-white/10"
              : "bg-transparent"
            : "bg-white border-b border-[#CFCFCF]",
        ].join(" ")}
        style={{ height: "var(--nav-height)" }}
      >
        <div className={[
          "max-w-screen-xl mx-auto px-6 lg:px-10 h-full flex items-center justify-between",
          isHome ? "text-white" : "text-black",
        ].join(" ")}>
          {/* Logo */}
          <Logo variant={isHome ? "light" : "dark"} size="md" />

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-8"
            aria-label="Primary navigation"
          >
            {NAV_ITEMS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={[
                  "text-[0.7rem] font-sans font-normal tracking-[0.18em] uppercase transition-colors duration-200",
                  isHome
                    ? "text-pearl hover:text-white"
                    : "text-[#626262] hover:text-black",
                ].join(" ")}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Action icons */}
          <div className="flex items-center gap-0.5">
            <button
              aria-label="Search"
              className={[
                "p-2.5 transition-colors duration-200",
                isHome ? "text-pearl hover:text-white" : "text-[#444] hover:text-black",
              ].join(" ")}
            >
              <Search size={17} strokeWidth={1.5} />
            </button>
            <button
              aria-label="Account"
              className={[
                "p-2.5 transition-colors duration-200",
                isHome ? "text-pearl hover:text-white" : "text-[#444] hover:text-black",
              ].join(" ")}
            >
              <User size={17} strokeWidth={1.5} />
            </button>
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className={[
                "relative p-2.5 transition-colors duration-200",
                isHome ? "text-pearl hover:text-white" : "text-[#444] hover:text-black",
              ].join(" ")}
            >
              <Heart size={17} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className={[
                  "absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-sans font-medium leading-none",
                  isHome ? "bg-white text-black" : "bg-black text-white",
                ].join(" ")}>
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              className={[
                "relative p-2.5 transition-colors duration-200",
                isHome ? "text-pearl hover:text-white" : "text-[#444] hover:text-black",
              ].join(" ")}
            >
              <ShoppingBag size={17} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className={[
                  "absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-sans font-medium leading-none",
                  isHome ? "bg-white text-black" : "bg-black text-white",
                ].join(" ")}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Hamburger — mobile only */}
            <button
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className={[
                "p-2.5 transition-colors duration-200 md:hidden",
                isHome ? "text-pearl hover:text-white" : "text-[#444] hover:text-black",
              ].join(" ")}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen
                ? <X    size={19} strokeWidth={1.5} />
                : <Menu size={19} strokeWidth={1.5} />
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen overlay ─────────────────── */}
      <div
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!menuOpen}
        className={[
          "fixed inset-0 z-40 bg-charcoal flex flex-col",
          "transition-transform duration-300 ease-in-out",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <nav
          className="flex flex-col gap-7 px-8 pb-12"
          style={{ paddingTop: "calc(var(--nav-height) + 3rem)" }}
          aria-label="Mobile navigation"
        >
          {NAV_ITEMS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              className="text-[2rem] font-display font-light tracking-[0.2em] uppercase text-white hover:text-silver transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-8 pb-12 border-t border-stone/40 pt-6">
          <p className="text-[0.68rem] font-sans tracking-[0.2em] uppercase text-stone">
            Premium Sterling Silver
          </p>
        </div>
      </div>
    </>
  );
}
