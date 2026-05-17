"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "left" | "none";
  className?: string;
  threshold?: number;
}

export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
  threshold = 0.12,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const hiddenClass =
    direction === "left" ? "fade-hidden-left" : direction === "up" ? "fade-hidden" : "opacity-0";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: "650ms", transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }}
      className={`transition-all ${visible ? "fade-visible" : hiddenClass} ${className}`}
    >
      {children}
    </div>
  );
}
