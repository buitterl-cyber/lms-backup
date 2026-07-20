"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Ambient floating orbs for the dark marketing hero — continuous, soft, token-colored. */
export function HeroOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="mkt-orb mkt-orb-a" />
      <span className="mkt-orb mkt-orb-b" />
      <span className="mkt-orb mkt-orb-c" />
      <span className="mkt-grid-fade" />
    </div>
  );
}

/** Infinite capability marquee — motion without inventing customer logos. */
export function CapabilityMarquee({ items }: { items: readonly string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="mkt-marquee relative overflow-hidden border-y border-white/10 bg-black/20 py-4">
      <div className="mkt-marquee-track">
        {doubled.map((item, i) => (
          <span key={`${item}-${i}`} className="flex shrink-0 items-center gap-8 px-4">
            <span className="text-sm font-medium tracking-wide text-white/70">{item}</span>
            <span className="h-1 w-1 rounded-full bg-accentTeal/70" />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Count-up for proof stats — only animates when scrolled into view. */
export function CountUp({
  end,
  suffix = "",
  durationMs = 1400,
  className = "",
}: {
  end: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(end);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [end]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(end * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, end, durationMs]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

/** Cycles activity rows so the hero mock feels live. */
export function LiveActivity({
  items,
}: {
  items: readonly { color: string; text: string; meta: string }[];
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 2800);
    return () => clearInterval(t);
  }, [items.length]);

  return (
    <ul className="mt-1.5 space-y-2">
      {items.map((a, i) => {
        const active = i === idx;
        return (
          <li
            key={a.text}
            className={`flex items-start gap-1.5 rounded-md px-1 py-0.5 transition duration-500 ${
              active ? "bg-white/8 opacity-100" : "opacity-45"
            }`}
          >
            <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${a.color} ${active ? "mkt-pulse" : ""}`} />
            <div className="min-w-0">
              <p className="text-[11px] leading-snug text-white/90">{a.text}</p>
              <p className="text-[9px] text-white/40">{a.meta}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Glass floating nav shell used on the dark hero. */
export function MarketingNav({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-40 px-4 pt-4 transition duration-300 ${
        scrolled ? "pb-2" : "pb-0"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-3 transition duration-300 ${
          scrolled
            ? "border-white/15 bg-heroPanel/85 shadow-lg shadow-black/30 backdrop-blur-xl"
            : "border-white/10 bg-white/5 backdrop-blur-md"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
