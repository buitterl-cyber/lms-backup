"use client";

import { useEffect, useRef, useState } from "react";
import { SKINS, THEME_COOKIE, skinMode } from "@/components/themes";
import { Card } from "@/components/ui";
import { DropdownPortal } from "@/components/DropdownPortal";

/** Skin picker: instant live preview (tokens swap on <html data-theme>), persisted in a
 *  cookie so the server renders the chosen skin on the next visit with no flash.
 *
 *  The panel is portaled to <body> (see DropdownPortal) rather than absolutely positioned
 *  in place — this header sits inside ancestors with their own stacking contexts (sticky
 *  sidebar, transformed cards, etc. depending on the page), any of which can trap a plain
 *  `absolute` dropdown behind other content even with a high z-index of its own. */
export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("riyada");
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(document.documentElement.dataset.theme || "riyada");
    function close(e: MouseEvent) {
      const target = e.target as Node;
      if (!open) return;
      if (trigger.current?.contains(target)) return;
      if (panel.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function apply(key: string) {
    document.documentElement.dataset.theme = key;
    // The dark/light class no longer just rides along from the initial SSR paint — a live
    // switch has to flip it explicitly too, now that it's not relying on cascade order.
    document.documentElement.classList.toggle("dark", skinMode(key) === "dark");
    document.cookie = `${THEME_COOKIE}=${key}; path=/; max-age=31536000; samesite=lax`;
    setActive(key);
  }

  return (
    <>
      <button
        ref={trigger}
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

      <DropdownPortal anchorRef={trigger} panelRef={panel} open={open}>
        <Card radius="2xl" padding="sm" className="w-[min(18rem,calc(100vw-1.5rem))] shadow-2xl">
          <p className="px-1 text-xs font-medium">Pick your skin</p>
          <p className="px-1 text-[11px] text-muted">Same app, your vibe. Saved to this browser.</p>
          <div className="mt-2 grid max-h-80 grid-cols-2 gap-1.5 overflow-y-auto pe-1">
            {SKINS.map((s) => (
              <button
                key={s.key}
                onClick={() => apply(s.key)}
                className={`flex items-center gap-2.5 rounded-xl border p-2 text-start transition-colors ${
                  active === s.key ? "border-brand bg-brand/10" : "border-border hover:border-brand/40"
                }`}
              >
                <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-border" style={{ background: s.bg }}>
                  <span className="absolute inset-y-0 end-0 w-1/2" style={{ background: s.brand }} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{s.name}</span>
                  <span className="block truncate text-[10px] text-muted">{s.tag}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </DropdownPortal>
    </>
  );
}
