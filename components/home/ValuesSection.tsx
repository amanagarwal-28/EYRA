import { FadeIn } from "@/components/ui/FadeIn";

const VALUES = [
  {
    title: "PREMIUM CRAFTSMANSHIP",
    body: "Every Eyra piece is thoughtfully handcrafted with attention to detail, precision, and timeless finishing.",
  },
  {
    title: "SKIN FRIENDLY",
    body: "Lightweight, smooth and comfortable jewellery designed for sensitive skin and all-day wear.",
  },
  {
    title: "TARNISH RESISTANT",
    body: "Crafted to maintain brilliance and elegance through everyday moments and timeless styling.",
  },
  {
    title: "PREMIUM CRAFTSMANSHIP",
    body: "Every Eyra piece is thoughtfully handcrafted with attention to detail, precision, and timeless finishing.",
  },
  {
    title: "PREMIUM CRAFTSMANSHIP",
    body: "Every Eyra piece is thoughtfully handcrafted with attention to detail, precision, and timeless finishing.",
  },
];

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-jet flex-shrink-0">
      <path
        d="M9 0L10.06 6.83L16.5 9L10.06 11.17L9 18L7.94 11.17L1.5 9L7.94 6.83L9 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ValuesSection() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-16">

        {/* Section header */}
        <FadeIn className="mb-16 text-center">
          <p className="font-sans font-light tracking-[0.3em] uppercase text-[0.8rem] text-jet">
            OUR VALUES
          </p>
        </FadeIn>

        {/* Row 1 — 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-14 mb-12">
          {VALUES.slice(0, 3).map((v, i) => (
            <FadeIn key={v.title + i} delay={i * 80} className="flex flex-col items-center text-center gap-4">
              <StarIcon />
              <p className="font-sans font-medium text-[0.78rem] tracking-[0.12em] uppercase text-jet">
                {v.title}
              </p>
              <p className="font-sans font-light text-[0.82rem] leading-relaxed text-carbon">
                {v.body}
              </p>
            </FadeIn>
          ))}
        </div>

        {/* Row 2 — 2 columns centred */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 lg:gap-14 max-w-2xl mx-auto">
          {VALUES.slice(3).map((v, i) => (
            <FadeIn key={v.title + i + 3} delay={i * 80 + 240} className="flex flex-col items-center text-center gap-4">
              <StarIcon />
              <p className="font-sans font-medium text-[0.78rem] tracking-[0.12em] uppercase text-jet">
                {v.title}
              </p>
              <p className="font-sans font-light text-[0.82rem] leading-relaxed text-carbon">
                {v.body}
              </p>
            </FadeIn>
          ))}
        </div>

      </div>
    </section>
  );
}
