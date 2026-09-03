"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Brand } from "@/components/Brand";
import { PageviewBeacon } from "@/components/PageviewBeacon";

/** Floating public chrome for catalogue / secondary marketing pages — matches homepage style. */
export function PublicChrome({
  active = "courses",
}: {
  active?: "courses" | "home";
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 px-2 pt-2 sm:px-4 sm:pt-4">
      <PageviewBeacon />
      <div
        className={`relative z-50 mx-auto flex max-w-[1280px] items-center justify-between gap-2 rounded-2xl border px-2.5 py-2 transition duration-300 sm:gap-3 sm:px-4 sm:py-3 ${
          scrolled || open
            ? "border-border/80 bg-card/95 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:backdrop-blur-xl"
            : "border-border/50 bg-card/70 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.18)] backdrop-blur-sm sm:backdrop-blur-md"
        }`}
      >
        <Link href="/" className="min-w-0 shrink ps-0.5 sm:ps-1" onClick={close}>
          <Brand size={26} className="text-[0.95rem] sm:text-[1.05rem]" />
        </Link>

        <nav className="hidden items-center gap-6 text-[13px] font-medium text-muted lg:flex" aria-label="Primary">
          <Link href="/#product" className={active === "home" ? "text-fg" : "hover:text-fg"}>
            Product
          </Link>
          <Link href="/security" className="hover:text-fg">
            Compliance
          </Link>
          <Link href="/courses" className={active === "courses" ? "text-fg" : "hover:text-fg"}>
            Content Library
          </Link>
          <Link href="/pricing" className="hover:text-fg">
            Pricing
          </Link>
          <Link href="/company" className="hover:text-fg">
            Company
          </Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className="rounded-full px-3 py-2 text-[13px] font-medium text-muted transition hover:bg-bg hover:text-fg">
            Log in
          </Link>
          <Link href="/#book-demo" className="mkt-btn-demo inline-flex min-h-10 items-center justify-center rounded-full px-5 text-[13px] font-semibold">
            Book a demo
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border text-fg lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Dismiss menu"
            className="fixed inset-0 z-40 bg-black/45 lg:hidden"
            onClick={close}
          />
          <div
            id={menuId}
            className="relative z-50 mx-auto mt-2 max-w-[1280px] overflow-hidden rounded-2xl border border-border bg-card shadow-xl lg:hidden"
          >
            <nav className="flex flex-col px-2 py-2" aria-label="Mobile">
              <Link href="/#product" onClick={close} className="flex min-h-12 items-center rounded-xl px-3 text-[15px] font-medium active:bg-bg">
                Product
              </Link>
              <Link href="/security" onClick={close} className="flex min-h-12 items-center rounded-xl px-3 text-[15px] font-medium active:bg-bg">
                Compliance
              </Link>
              <Link href="/courses" onClick={close} className="flex min-h-12 items-center rounded-xl px-3 text-[15px] font-medium active:bg-bg">
                Content Library
              </Link>
              <Link href="/pricing" onClick={close} className="flex min-h-12 items-center rounded-xl px-3 text-[15px] font-medium active:bg-bg">
                Pricing
              </Link>
              <Link href="/company" onClick={close} className="flex min-h-12 items-center rounded-xl px-3 text-[15px] font-medium active:bg-bg">
                Company
              </Link>
              <Link href="/login" onClick={close} className="flex min-h-12 items-center rounded-xl px-3 text-[15px] font-medium active:bg-bg">
                Log in
              </Link>
              <div className="px-2 pb-2 pt-1">
                <Link
                  href="/#book-demo"
                  onClick={close}
                  className="mkt-btn-demo flex min-h-12 items-center justify-center rounded-full text-sm font-semibold"
                >
                  Book a demo
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
