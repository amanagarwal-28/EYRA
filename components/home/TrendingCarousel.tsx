"use client";

import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";

const PRODUCTS = [
  {
    src: "/images/product-1.jpg",
    name: "Classic Chain Collection",
    price: "₹2,499",
    href: "/products/classic-chain-collection",
  },
  {
    src: "/images/product-2.jpg",
    name: "Everyday Pendant",
    price: "₹1,899",
    href: "/products/everyday-pendant",
  },
  {
    src: "/images/product-3.jpg",
    name: "Signature Silver Ring",
    price: "₹1,299",
    href: "/products/signature-silver-ring",
  },
  {
    src: "/images/product-4.jpg",
    name: "Modern Silver Bracelet",
    price: "₹2,199",
    href: "/products/modern-silver-bracelet",
  },
  {
    src: "/images/product-5.png",
    name: "Signature Silver Ring",
    price: "₹1,499",
    href: "/products/signature-silver-ring-2",
  },
];

export function TrendingCarousel() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-16">

        {/* Section header */}
        <FadeIn className="mb-4 text-center">
          <p className="font-display italic font-light leading-[1.05] text-[clamp(2.2rem,4.5vw,4rem)] text-jet">
            Most Loved Pieces
          </p>
        </FadeIn>

        <FadeIn delay={80} className="mb-12 text-center">
          <p className="font-sans font-light text-[0.88rem] leading-relaxed text-carbon max-w-xl mx-auto">
            Discover Eyra&rsquo;s most loved silver jewellery timeless essentials chosen for their
            elegance, versatility, and everyday luxury.
          </p>
        </FadeIn>

        {/* Horizontal scroll track */}
        <FadeIn delay={140}>
          <div className="flex gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2">
            {PRODUCTS.map((product) => (
              <Link
                key={product.name + product.price}
                href={product.href}
                className="group flex-shrink-0 snap-start w-[200px] sm:w-[220px]"
              >
                <div className="relative overflow-hidden bg-cloud aspect-square mb-3 rounded-full">
                  <Image
                    src={product.src}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="220px"
                  />
                </div>
                <p className="font-sans font-light text-[0.82rem] text-carbon text-center leading-snug">
                  {product.name}
                </p>
              </Link>
            ))}
          </div>
        </FadeIn>

        {/* CTA */}
        <FadeIn delay={200} className="mt-12 flex justify-center">
          <Link
            href="/collections"
            className="inline-flex items-center justify-center bg-jet text-white font-sans text-[0.88rem] tracking-[0.06em] px-8 py-4 rounded-full hover:bg-charcoal transition-colors duration-300"
          >
            Explore more
          </Link>
        </FadeIn>

      </div>
    </section>
  );
}
