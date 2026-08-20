"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * A trigger button that opens a panel below it, closing on an outside click
 * or Escape. No positioning library is installed, so the panel is always
 * anchored left with a fixed min-width, which is enough for short filter
 * lists but not general-purpose menu placement.
 */
export function Dropdown({
  label,
  active,
  children,
}: {
  label: string;
  /** Shown as a filled dot next to the label when a non-default value is selected. */
  active?: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className={[
          "flex items-center gap-2 font-sans font-normal text-[14px] leading-[21px] px-4 py-2.5 rounded-full border transition-colors duration-200",
          open
            ? "border-black text-black"
            : "border-[#CFCFCF] text-[#3D3D3D] hover:border-black hover:text-black",
        ].join(" ")}
      >
        {active && <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" aria-hidden="true" />}
        {label}
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[240px] bg-white border border-[#CFCFCF] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-5"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
