"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Search, ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const NAV_ITEMS = [
  { label: "Collections", href: "/collections" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "About",       href: "/about"        },
  { label: "Contact",     href: "/contact"      },
] as const;

export function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          scrolled
            ? "bg-charcoal/95 backdrop-blur-md border-b border-white/10"
            : "bg-transparent",
        ].join(" ")}
        style={{ height: "var(--nav-height)" }}
      >
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 h-full flex items-center justify-between text-white">
          {/* Logo */}
          <Logo variant="light" size="md" />

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-8"
            aria-label="Primary navigation"
          >
            {NAV_ITEMS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-[0.7rem] font-sans font-normal tracking-[0.18em] uppercase text-pearl hover:text-white transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Action icons */}
          <div className="flex items-center gap-0.5">
            <button
              aria-label="Search"
              className="p-2.5 text-pearl hover:text-white transition-colors duration-200"
            >
              <Search size={17} strokeWidth={1.5} />
            </button>
            <button
              aria-label="Account"
              className="p-2.5 text-pearl hover:text-white transition-colors duration-200"
            >
              <User size={17} strokeWidth={1.5} />
            </button>
            <button
              aria-label="Cart"
              className="p-2.5 text-pearl hover:text-white transition-colors duration-200"
            >
              <ShoppingBag size={17} strokeWidth={1.5} />
            </button>

            {/* Hamburger — mobile only */}
            <button
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="p-2.5 text-pearl hover:text-white transition-colors duration-200 md:hidden"
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
