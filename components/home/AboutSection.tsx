import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";

export function AboutSection() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-16 flex flex-col items-center text-center gap-7">
        <FadeIn>
          <p className="font-display font-light tracking-[0.2em] uppercase text-[1.6rem] lg:text-[2rem] text-jet">
            About the Product
          </p>
        </FadeIn>

        <FadeIn delay={100} className="max-w-2xl">
          <p className="font-light text-[1rem] lg:text-[1.1rem] leading-relaxed text-carbon">
            At Eyra, every piece is thoughtfully crafted using high-quality 925 sterling silver to deliver
            elegance, comfort, and durability in perfect balance. Our collections are designed for both men
            and women who appreciate minimal luxury and timeless style.
          </p>
        </FadeIn>

        <FadeIn delay={180}>
          <Link
            href="/collections"
            className="inline-flex items-center justify-center bg-jet text-white font-sans text-[0.9rem] tracking-[0.06em] px-8 py-4 rounded-full hover:bg-charcoal transition-colors duration-300"
          >
            Learn more
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
