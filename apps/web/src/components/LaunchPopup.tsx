"use client";

import { useEffect, useRef, useState } from "react";
import { Brand } from "./Brand";
import { COUNTRY_CODES } from "./country-codes";
import { Button, Card } from "@/components/ui";
import { isValidEmail } from "@/lib/validation";

const DISMISS_KEY = "riyada-launch-popup-dismissed";
const DEFAULT_ISO = "AE";

/** Dial-code picker with real flag images (native <select><option> can't render a background
 *  image, so flag emoji — which Windows renders as plain letters, not a picture — won't work
 *  inside one; this is a small custom listbox instead). */
function CountryPicker({ iso, onChange }: { iso: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = COUNTRY_CODES.find((c) => c.iso === iso) ?? COUNTRY_CODES[0];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Country code"
        className="flex h-11 w-[5.5rem] items-center gap-1.5 rounded-xl border border-border bg-bg px-2.5 text-sm outline-none focus:border-brand sm:h-full sm:w-[5.75rem] sm:rounded-lg sm:py-2"
      >
        <span className={`fi fi-${current.iso.toLowerCase()}`} />
        <span>{current.dial}</span>
      </button>
      {open && (
        <ul className="absolute bottom-full z-10 mb-1 max-h-48 w-64 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-2xl sm:bottom-auto sm:top-full sm:mb-0 sm:mt-1 sm:max-h-56 sm:rounded-lg">
          {COUNTRY_CODES.map((c) => (
            <li key={c.iso}>
              <button
                type="button"
                onClick={() => {
                  onChange(c.iso);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-bg sm:py-1.5"
              >
                <span className={`fi fi-${c.iso.toLowerCase()}`} />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-muted">{c.dial}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Official-launch promo popup for the public marketing page — 25% off, captures
 *  name/company/email/phone as a sales inquiry (same pipeline as InquiryForm) so a submit
 *  becomes a CRM deal and emails sales immediately. Dismissal is remembered for the current
 *  browser session only (not permanently), so closing it once doesn't hide it forever.
 *  Mobile: bottom sheet so the page stays usable; desktop: centered modal. */
export function LaunchPopup() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", iso: DEFAULT_ISO, phone: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(DISMISS_KEY) === "1") return;

    // Don't eclipse the hero: open after the visitor scrolls past the fold,
    // with a long idle fallback for non-scrollers.
    let opened = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      if (idleTimer) clearTimeout(idleTimer);
    };

    const openOnce = () => {
      if (opened) return;
      opened = true;
      cleanup();
      setOpen(true);
    };

    function onScroll() {
      if (window.scrollY > 280) openOnce();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    idleTimer = setTimeout(openOnce, 5000);

    return cleanup;
  }, []);

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
    window.sessionStorage.setItem(DISMISS_KEY, "1");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");
    if (!form.name.trim() || !form.company.trim()) {
      setValidationError("Please fill in your name and company.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setValidationError("Enter a valid email address.");
      return;
    }
    setState("busy");
    try {
      const dial = COUNTRY_CODES.find((c) => c.iso === form.iso)?.dial ?? "";
      const res = await fetch("/api/v1/sales/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          phone: form.phone ? `${dial} ${form.phone}` : undefined,
          message: "Requested the 25% official-launch discount.",
        }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) setTimeout(close, 1800);
    } catch {
      setState("error");
    }
  }

  if (!open) return null;

  const input =
    "w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-base outline-none focus:border-brand sm:rounded-lg sm:py-2 sm:text-sm";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:bg-black/50 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && close()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="launch-popup-title"
    >
      <Card
        radius="2xl"
        padding="none"
        className="relative max-h-[min(85dvh,36rem)] w-full max-w-md overflow-y-auto rounded-b-none rounded-t-3xl shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
      >
        {/* Mobile drag affordance */}
        <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute end-2.5 top-2.5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted shadow-sm hover:bg-bg hover:text-fg sm:end-3 sm:top-3 sm:h-9 sm:w-9 sm:border-0 sm:bg-transparent sm:shadow-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 sm:p-6 sm:pt-7">
          <div className="flex justify-center pe-8">
            <Brand size={24} className="text-[0.9rem]" />
          </div>

          {state === "done" ? (
            <div className="mt-4 pb-3 text-center sm:mt-5 sm:pb-4">
              <p className="font-medium text-green">You&apos;re on the list! ✓</p>
              <p className="mt-1 text-sm text-muted">One of our account managers will contact you shortly!</p>
            </div>
          ) : (
            <>
              <h2 id="launch-popup-title" className="font-display mt-3 text-center text-lg font-semibold leading-snug sm:mt-5 sm:text-xl">
                25% off our official launch
              </h2>
              <p className="mt-1 text-center text-sm text-muted">
                Leave your details — we&apos;ll be in touch shortly.
              </p>

              <form onSubmit={submit} className="mt-4 space-y-2.5 sm:mt-5" noValidate>
                <input
                  required
                  placeholder="Full name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={input}
                />
                <input
                  required
                  placeholder="Company name"
                  autoComplete="organization"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className={input}
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={input}
                />
                <div className="flex gap-2">
                  <CountryPicker iso={form.iso} onChange={(iso) => setForm({ ...form, iso })} />
                  <input
                    type="tel"
                    placeholder="Mobile (optional)"
                    autoComplete="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={input}
                  />
                </div>
                {validationError && (
                  <p className="text-xs text-red" role="alert">{validationError}</p>
                )}
                <Button type="submit" disabled={state === "busy"} className="mt-0.5 min-h-12 w-full rounded-xl text-base sm:min-h-10 sm:rounded-lg sm:text-sm">
                  {state === "busy" ? "Sending…" : state === "error" ? "Something went wrong — retry" : "Claim my 25% off"}
                </Button>
                <button
                  type="button"
                  onClick={close}
                  className="mx-auto block w-full py-2.5 text-center text-sm text-muted hover:text-fg sm:hidden"
                >
                  Not now
                </button>
              </form>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
