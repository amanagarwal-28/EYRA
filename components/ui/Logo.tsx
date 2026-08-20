import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

/*
  Wordmark source: public/images/logo-mark-{white,black}.png. Both are
  cropped tight to just the "EYRA" wordmark and its flourish (native aspect
  ratio 127:74), sourced from the brand's real logo artwork and keyed to
  transparent, so "Jewel" is rendered separately as real text below rather
  than baked into the raster. That keeps it independently styleable, which
  matters since it's set noticeably lighter than the wordmark and needs its
  own weight/colour/size per breakpoint.
*/
const WORDMARK_ASPECT = 127 / 74;

const sizes = {
  sm: { markH: 22, jewel: "text-[10px]", tracking: "tracking-[2.5px]" },
  md: { markH: 28, jewel: "text-[11px]", tracking: "tracking-[3px]" },
  lg: { markH: 38, jewel: "text-[13px]", tracking: "tracking-[3.6px]" },
} as const;

export function Logo({ className = "", variant = "dark", size = "md" }: LogoProps) {
  const jewelColor = variant === "light" ? "text-pearl" : "text-[#5f5f5f]";
  const { markH, jewel, tracking } = sizes[size];
  const markW = Math.round(markH * WORDMARK_ASPECT);

  return (
    <Link
      href="/"
      aria-label="EYRA Home"
      className={`inline-flex flex-col items-start ${className} hover:opacity-80 transition-opacity duration-200`}
    >
      {/* ── Wordmark ─────────────────────────────────── */}
      <Image
        src={variant === "light" ? "/images/logo-mark-white.png" : "/images/logo-mark-black.png"}
        alt="EYRA"
        width={markW}
        height={markH}
        priority
        className="w-auto shrink-0"
        style={{ height: markH }}
      />

      {/* ── "Jewel" tagline, set with more weight/contrast than the
             wordmark so it reads as a deliberate accent rather than
             disappearing next to it ─────────────────────────────── */}
      <span
        className={`font-sans font-medium leading-none uppercase mt-[3px] ${jewel} ${tracking} ${jewelColor}`}
      >
        Jewel
      </span>
    </Link>
  );
}
