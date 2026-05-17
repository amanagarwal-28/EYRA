import Link from "next/link";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

/*
  Ornament dimensions at each size.
  The ornament is assembled from the exact 4 SVG vector paths exported from Figma
  (file IQCv905HaRtvjchwcoh6Ze, node 119:117). viewBox stays "0 0 6 12" —
  only the rendered pixel size scales.
*/
const sizes = {
  sm: { eyra: "text-[1.15rem]", jewel: "text-[5.5px]", tracking: "tracking-[2px]",   ornW: 4.5, ornH: 9  },
  md: { eyra: "text-[1.5rem]",  jewel: "text-[7px]",   tracking: "tracking-[2.4px]", ornW: 6,   ornH: 12 },
  lg: { eyra: "text-[2rem]",    jewel: "text-[9px]",   tracking: "tracking-[3px]",   ornW: 7.5, ornH: 15 },
} as const;

/*
  Logo ornament — reconstructed from the four Figma vectors that form a
  decorative vertical bar: pointed diamond tip (top) + tapered body (bottom),
  mirrored left/right with a 2px gap in the centre.

  Vectors and transforms match Figma node positions exactly:
    Vector 12 (2×4): top-left quadrant, no transform
    Vector 13 (2×4): top-right, horizontal mirror (scaleX -1 at x=6)
    Vector 14 (2×8): bottom-left, flipped vertically (scaleY -1 at y=12)
    Vector 15 (2×8): bottom-right, rotated 180° (scale -1,-1 at 6,12)
*/
function Ornament({ width, height, className = "" }: { width: number; height: number; className?: string }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 6 12"
      fill="currentColor"
      aria-hidden="true"
      className={`flex-shrink-0 ${className}`}
    >
      <path d="M2 4H0C1.10698 2.81228 1.43715 1.81294 2 0V4Z" />
      <path transform="translate(6,0) scale(-1,1)"  d="M2 4H0C1.10698 2.81228 1.43715 1.81294 2 0V4Z" />
      <path transform="translate(0,12) scale(1,-1)"  d="M2 8H0C1.47374 5.64381 1.67327 3.63834 2 0V8Z" />
      <path transform="translate(6,12) scale(-1,-1)" d="M2 8H0C1.47374 5.64381 1.67327 3.63834 2 0V8Z" />
    </svg>
  );
}

export function Logo({ className = "", variant = "dark", size = "md" }: LogoProps) {
  const wordColor  = variant === "light" ? "text-white"   : "text-jet";
  const jewelColor = variant === "light" ? "text-[#8e8e8e]" : "text-stone";
  const { eyra, jewel, tracking, ornW, ornH } = sizes[size];

  return (
    <Link
      href="/"
      aria-label="EYRA — Home"
      className={`inline-flex flex-col items-start ${wordColor} ${className} hover:opacity-80 transition-opacity duration-200`}
    >
      {/* ── Wordmark ─────────────────────────────────── */}
      <span
        className={`font-display font-light leading-none tracking-[0.06em] ${eyra}`}
      >
        EYRA
      </span>

      {/* ── Sub-mark: ornament + "Jewel" tagline ─────── */}
      <div className="flex items-center gap-[3px] mt-[3px]">
        <Ornament width={ornW} height={ornH} className={jewelColor} />
        <span
          className={`font-sans font-extralight leading-none uppercase ${jewel} ${tracking} ${jewelColor}`}
        >
          Jewel
        </span>
      </div>
    </Link>
  );
}
