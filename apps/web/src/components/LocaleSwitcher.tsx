"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dir, LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/i18n";
import { Card } from "@/components/ui";
import { DropdownPortal } from "@/components/DropdownPortal";

/** Locale picker: instant live preview (lang/dir flip on <html>), persisted in a cookie so the
 *  server renders the chosen locale on the next request with no flash — same shape as
 *  ThemeSwitcher's skin picker. router.refresh() re-renders server components (where t() runs)
 *  against the new cookie without a full page reload.
 *
 *  Portaled to <body> (see DropdownPortal) so it can't get trapped behind other content by a
 *  parent's stacking context — same fix as ThemeSwitcher. */
export function LocaleSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Locale>("en");
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive((document.documentElement.lang as Locale) || "en");
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

  function apply(locale: Locale) {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir(locale);
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    setActive(locale);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        ref={trigger}
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl border border-border bg-card/70 p-2 backdrop-blur hover:border-brand/50"
        aria-label="Language and layout direction"
        title="Language and layout direction"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z" />
        </svg>
      </button>

      <DropdownPortal anchorRef={trigger} panelRef={panel} open={open}>
        <Card radius="2xl" padding="sm" className="w-56 shadow-2xl">
          <p className="px-1 text-xs font-medium">Language &amp; direction</p>
          <div className="mt-2 flex flex-col gap-1">
            {LOCALES.map((l) => (
              <button
                key={l.key}
                onClick={() => apply(l.key)}
                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-start text-sm transition-colors ${
                  active === l.key ? "bg-brand/10 font-medium text-brand" : "hover:bg-bg"
                }`}
              >
                <span>{l.nativeName}</span>
                {l.key === "ar" && (
                  <span className="shrink-0 text-[10px] font-normal text-muted">RTL preview</span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-2 border-t border-border px-1 pt-2 text-[11px] leading-snug text-muted">
            Arabic switches the layout to right-to-left. Translated content is coming later — most
            text still displays in English.
          </p>
        </Card>
      </DropdownPortal>
    </>
  );
}
