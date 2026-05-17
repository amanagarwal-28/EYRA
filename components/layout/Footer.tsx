import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { NewsletterForm } from "./NewsletterForm";

const SHOP_LINKS = [
  { label: "All Collections",  href: "/collections"          },
  { label: "New Arrivals",      href: "/new-arrivals"         },
  { label: "Rings",             href: "/collections/rings"    },
  { label: "Necklaces",         href: "/collections/necklaces"},
  { label: "Bracelets",         href: "/collections/bracelets"},
  { label: "Earrings",          href: "/collections/earrings" },
] as const;

const COMPANY_LINKS = [
  { label: "About EYRA",    href: "/about"          },
  { label: "Craftsmanship", href: "/craftsmanship"  },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Contact",       href: "/contact"        },
  { label: "Careers",       href: "/careers"        },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy Policy",  href: "/legal/privacy"  },
  { label: "Terms of Use",    href: "/legal/terms"    },
  { label: "Shipping Policy", href: "/legal/shipping" },
  { label: "Returns",         href: "/legal/returns"  },
] as const;

function NavColumn({
  heading,
  links,
}: {
  heading: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-[0.68rem] font-sans font-normal tracking-[0.22em] uppercase text-white mb-6">
        {heading}
      </h3>
      <ul className="flex flex-col gap-3.5">
        {links.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-[0.82rem] font-light text-stone hover:text-white transition-colors duration-200 tracking-[0.03em]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-charcoal text-pearl" aria-label="Site footer">
      {/* ── Main body ───────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-12 lg:gap-16">

          {/* Brand + social + newsletter */}
          <div className="flex flex-col gap-7">
            <Logo variant="light" size="lg" />

            <p className="text-[0.82rem] font-light leading-relaxed text-stone max-w-[280px] tracking-[0.02em]">
              Crafted from 925 sterling silver — for those who wear their identity.
            </p>

            {/* Social links — lucide-react v1.16 omits brand icons; using SVG paths */}
            <div className="flex items-center gap-5">
              <a
                href="https://instagram.com/eyrajewelry"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="EYRA on Instagram"
                className="text-stone hover:text-white transition-colors duration-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4.5" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="https://x.com/eyrajewelry"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="EYRA on X"
                className="text-stone hover:text-white transition-colors duration-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://pinterest.com/eyrajewelry"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="EYRA on Pinterest"
                className="text-stone hover:text-white transition-colors duration-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.141-.828 3.33-.236.995.499 1.806 1.476 1.806 1.771 0 3.133-1.867 3.133-4.562 0-2.387-1.715-4.057-4.163-4.057-2.836 0-4.5 2.127-4.5 4.326 0 .856.33 1.773.741 2.274a.3.3 0 0 1 .069.286c-.076.31-.244.995-.277 1.134-.044.183-.146.222-.337.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
                </svg>
              </a>
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-[0.68rem] font-sans font-normal tracking-[0.2em] uppercase text-pearl mb-3">
                Stay in the loop
              </p>
              <NewsletterForm />
            </div>
          </div>

          {/* Shop links */}
          <NavColumn heading="Shop" links={SHOP_LINKS} />

          {/* Company + Legal stacked */}
          <div className="flex flex-col gap-10">
            <NavColumn heading="Company" links={COMPANY_LINKS} />
            <NavColumn heading="Legal"   links={LEGAL_LINKS}   />
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────── */}
      <div className="border-t border-stone/60">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[0.72rem] font-light text-stone tracking-[0.05em]">
            © {new Date().getFullYear()} EYRA. All rights reserved.
          </p>
          <p className="text-[0.72rem] font-light text-stone tracking-[0.05em]">
            Handcrafted in India
          </p>
        </div>
      </div>
    </footer>
  );
}
