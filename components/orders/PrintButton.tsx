"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-8 py-[14px] bg-black text-white font-sans font-medium text-[16px] rounded-full hover:bg-[#1a1a1a] transition-colors duration-200 print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}
