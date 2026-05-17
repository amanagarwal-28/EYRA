"use client";

import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="bg-white">
      {/* ── Announcement strip ───────────────────────── */}
      <div className="border-b border-cloud">
        <p className="text-center py-3 text-[0.72rem] font-sans font-normal tracking-[0.22em] uppercase text-carbon">
          Made to order&nbsp;&nbsp;|&nbsp;&nbsp;Crafted within 7–10 days
        </p>
      </div>

      {/* ── Display heading ──────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-16 pt-14 pb-4 text-center">
        <h1 className="font-display font-light leading-[1.05] tracking-[-0.01em] text-[clamp(3.2rem,8.5vw,8rem)] text-jet">
          Timeless{" "}
          <span className="italic text-pearl">Silver.</span>
          <br />
          Modern Expression.
        </h1>
      </div>

      {/* ── Hero image / video container ─────────────── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-16 pb-0">
        <div className="relative overflow-hidden bg-pewter" style={{ height: "clamp(340px, 55vw, 700px)" }}>
          {/* Video element — swap src for a real .mp4 when available */}
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/images/Hero-bg.png"
            className="absolute inset-0 w-full h-full object-cover object-top"
          >
            {/* <source src="/videos/hero.mp4" type="video/mp4" /> */}
          </video>

          {/* Dark gradient overlay — bottom only, preserves image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Left caption */}
          <div className="absolute bottom-[28%] left-6 lg:left-16 max-w-[220px] lg:max-w-[260px]">
            <p className="text-white text-[0.78rem] lg:text-[0.88rem] font-light leading-relaxed tracking-[0.02em]">
              Inspired by timeless artistry and crafted to become a part of your everyday identity.
            </p>
          </div>

          {/* Right caption */}
          <div className="absolute top-[40%] right-6 lg:right-16 max-w-[180px] lg:max-w-[220px]">
            <p className="text-white text-[0.78rem] lg:text-[0.88rem] font-light leading-relaxed tracking-[0.02em]">
              Crafted in premium 925 sterling silver with a timeless finish designed for everyday elegance.
            </p>
          </div>

          {/* Pagination dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`block rounded-full transition-all duration-300 ${
                  i === 0 ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
