import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-jet" style={{ minHeight: "clamp(380px, 42vw, 560px)" }}>
      {/* Background image */}
      <Image
        src="/images/cta-image.jpg"
        alt=""
        fill
        className="object-cover object-center opacity-35"
        sizes="100vw"
      />

      {/* Content */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 lg:px-16 h-full flex flex-col items-center justify-center text-center py-24 gap-7">
        <FadeIn>
          <p className="font-display font-light leading-[1.1] text-[clamp(2rem,5vw,3.8rem)] text-white">
            Discover Silver That Defines Your Style
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <p className="font-sans font-light text-[0.86rem] leading-relaxed text-white/70 max-w-md">
            Explore timeless 925 sterling silver jewellery crafted for modern elegance, everyday
            luxury, and effortless expression.
          </p>
        </FadeIn>

        <FadeIn delay={200} className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/collections"
            className="inline-flex items-center justify-center bg-white text-jet font-sans text-[0.85rem] tracking-[0.06em] px-8 py-4 rounded-full hover:bg-cloud transition-colors duration-300"
          >
            Shop Collection
          </Link>
          <Link
            href="/collections/new"
            className="inline-flex items-center justify-center border border-white/50 text-white font-sans text-[0.85rem] tracking-[0.06em] px-8 py-4 rounded-full hover:border-white hover:bg-white/10 transition-colors duration-300"
          >
            Explore New Arrivals
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
