import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-24 flex flex-col items-center gap-6 text-center">
      <svg
        width="72"
        height="72"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#CFCFCF"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-light italic text-[clamp(1.75rem,3vw,2.5rem)] text-black">
          Page Not Found
        </h1>
        <p className="font-sans font-normal text-[16px] text-[#909090] max-w-[420px]">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/products"
          className="px-8 py-[14px] bg-black text-white font-sans font-medium text-[16px] rounded-full hover:bg-[#1a1a1a] transition-colors duration-200"
        >
          Browse Products
        </Link>
        <Link
          href="/"
          className="px-8 py-[14px] border border-[#CFCFCF] text-black font-sans font-medium text-[16px] rounded-full hover:bg-[#F7F7F7] transition-colors duration-200"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
