import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";

export function NewCollections() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-16">

        {/* Section header */}
        <FadeIn className="mb-12">
          <p className="font-sans font-light tracking-[0.3em] uppercase text-[0.8rem] text-jet">
            NEW COLLECTIONS
          </p>
        </FadeIn>

        {/* Asymmetric grid: large left + right column (text top, image bottom) */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">

          {/* Large left image with text overlay */}
          <FadeIn>
            <Link
              href="/collections"
              className="group relative block overflow-hidden bg-jet"
              style={{ height: "clamp(420px, 60vw, 720px)" }}
            >
              <Image
                src="/images/new-col-1.jpg"
                alt="New collection"
                fill
                className="object-cover object-center opacity-80 transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-10 left-8 max-w-[260px]">
                <p className="font-sans font-light text-[0.88rem] leading-relaxed text-white mb-4">
                  Modern sterling silver designed to elevate every look.
                </p>
                <Link
                  href="/collections"
                  className="text-[0.72rem] font-sans font-light tracking-[0.2em] uppercase text-white border-b border-white/60 pb-px hover:border-white transition-colors duration-300"
                >
                  Browse
                </Link>
              </div>
            </Link>
          </FadeIn>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Top: text block */}
            <FadeIn delay={100}>
              <div className="bg-ivory px-8 py-10 flex flex-col justify-center gap-5" style={{ minHeight: "clamp(180px, 22vw, 260px)" }}>
                <p className="font-display font-light italic text-[clamp(1.2rem,2vw,1.6rem)] leading-snug text-jet">
                  Minimal pendants and layered chains crafted for timeless everyday styling.
                </p>
                <Link
                  href="/collections"
                  className="text-[0.72rem] font-sans font-light tracking-[0.2em] uppercase text-carbon border-b border-carbon pb-px w-fit hover:text-jet hover:border-jet transition-colors duration-300"
                >
                  Explore collection
                </Link>
              </div>
            </FadeIn>

            {/* Bottom: image */}
            <FadeIn delay={180}>
              <Link
                href="/collections"
                className="group relative block overflow-hidden bg-cloud flex-1"
                style={{ height: "clamp(200px, 28vw, 420px)" }}
              >
                <Image
                  src="/images/new-col-2.jpg"
                  alt="New collection rings"
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </Link>
            </FadeIn>

          </div>
        </div>

      </div>
    </section>
  );
}
