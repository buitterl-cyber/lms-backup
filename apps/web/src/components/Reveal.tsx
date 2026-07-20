"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Lightweight scroll reveal — toggles the existing `.reveal` / `.is-in` CSS in globals.css.
 *  No animation library; respects prefers-reduced-motion via the stylesheet. */
export function Reveal({
  children,
  className = "",
  delayMs = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "li" | "article" | "section";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style = delayMs ? ({ "--reveal-delay": `${delayMs}ms` } as CSSProperties) : undefined;

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${inView ? "is-in" : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  );
}
