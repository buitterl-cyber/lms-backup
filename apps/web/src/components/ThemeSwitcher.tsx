"use client";

import { useEffect, useRef, useState } from "react";
import { SKINS, THEME_COOKIE } from "@/components/themes";

/** Skin picker: instant live preview (tokens swap on <html data-theme>), persisted in a
 *  cookie so the server renders the chosen skin on the next visit with no flash. */
export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("riyada");
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(document.documentElement.dataset.theme || "riyada");
    function close(e: MouseEvent) {
      if (open && panel.current && !panel.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function apply(key: string) {
    document.documentElement.dataset.theme = key;
    document.cookie = `${THEME_COOKIE}=${key}; path=/; max-age=31536000; samesite=lax`;
    setActive(key);
  }

  return (
    <div className="relative" ref={panel}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl border border-border bg-card/70 p-2 backdrop-blur hover:border-brand/50"
        aria-label="Choose a skin"
        title="Choose a skin"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-border bg-card p-3 shadow-2xl">
          <p className="px-1 text-xs font-medium">Pick your skin</p>
          <p className="px-1 text-[11px] text-muted">Same app, your vibe. Saved to this browser.</p>
          <div className="mt-2 grid max-h-80 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
            {SKINS.map((s) => (
              <button
                key={s.key}
                onClick={() => apply(s.key)}
                className={`flex items-center gap-2.5 rounded-xl border p-2 text-left transition-colors ${
                  active === s.key ? "border-brand bg-brand/10" : "border-border hover:border-brand/40"
                }`}
              >
                <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-border" style={{ background: s.bg }}>
                  <span className="absolute inset-y-0 right-0 w-1/2" style={{ background: s.brand }} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{s.name}</span>
                  <span className="block truncate text-[10px] text-muted">{s.tag}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
