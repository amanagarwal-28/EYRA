import { FadeIn } from "@/components/ui/FadeIn";
import { NewsletterForm } from "@/components/layout/NewsletterForm";

export function NewsletterBanner() {
  return (
    <section className="bg-ivory border-y border-cloud py-20">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-16 flex flex-col items-center text-center gap-5">
        <FadeIn>
          <p className="font-display font-light text-[1.5rem] lg:text-[1.8rem] text-jet">
            Be the First to Discover Eyra
          </p>
        </FadeIn>

        <FadeIn delay={80} className="max-w-md">
          <p className="font-sans font-light text-[0.86rem] leading-relaxed text-carbon">
            Stay connected for exclusive silver drops, special offers, styling inspiration, and the
            latest arrivals — delivered straight to your inbox.
          </p>
        </FadeIn>

        <FadeIn delay={160} className="w-full max-w-sm">
          <NewsletterForm variant="light" />
        </FadeIn>
      </div>
    </section>
  );
}
