"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Brand } from "@/components/Brand";

const NAV = [
  { href: "#product", label: "Product" },
  { href: "#solutions", label: "Solutions" },
  { href: "#integrations", label: "Integrations" },
  { href: "#customers", label: "Customers" },
  { href: "#resources", label: "Resources" },
] as const;

/** Marketing-only header: Product / Solutions / … + Log in + single primary CTA “Book a demo”. */
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-200 ${
        scrolled
          ? "border-border bg-card/90 shadow-sm backdrop-blur-md"
          : "border-transparent bg-bg/80 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-5 sm:h-16 sm:px-6">
        <Link href="/" className="shrink-0" onClick={close}>
          <Brand size={28} className="text-[1.05rem]" />
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] font-medium text-muted lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-fg">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="text-[13px] font-medium text-muted transition hover:text-fg">
            Log in
          </Link>
          <a
            href="#book-demo"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-95"
          >
            Book a demo
          </a>
        </div>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-fg lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close" : "Menu"}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div id={menuId} className="border-t border-border bg-card lg:hidden">
          <nav className="mx-auto flex max-w-[1280px] flex-col gap-1 px-5 py-3" aria-label="Mobile">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-fg hover:bg-bg"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={close}
              className="flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-fg hover:bg-bg"
            >
              Log in
            </Link>
            <a
              href="#book-demo"
              onClick={close}
              className="mt-1 flex min-h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white"
            >
              Book a demo
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
