"use client";

import { useEffect, useRef, useState } from "react";
import { Brand } from "./Brand";
import { COUNTRY_CODES } from "./country-codes";
import { Button, Card } from "@/components/ui";

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
        className="flex h-full w-[5.75rem] items-center gap-1.5 rounded-lg border border-border bg-bg px-2.5 py-2 text-sm outline-none focus:border-brand"
      >
        <span className={`fi fi-${current.iso.toLowerCase()}`} />
        <span>{current.dial}</span>
      </button>
      {open && (
        <ul className="absolute z-10 mt-1 max-h-56 w-64 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-2xl">
          {COUNTRY_CODES.map((c) => (
            <li key={c.iso}>
              <button
                type="button"
                onClick={() => {
                  onChange(c.iso);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-bg"
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
 *  browser session only (not permanently), so closing it once doesn't hide it forever. */
export function LaunchPopup() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", iso: DEFAULT_ISO, phone: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(DISMISS_KEY) === "1") return;
    // Delay so the hero entrance + ambient motion land first (Docebo-style: promo
    // shouldn't eclipse the first impression).
    const t = setTimeout(() => setOpen(true), 5200);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setOpen(false);
    window.sessionStorage.setItem(DISMISS_KEY, "1");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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

  const input = "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <Card radius="2xl" padding="xl" className="relative w-full max-w-sm shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-bg hover:text-fg"
        >
          ✕
        </button>

        <div className="flex justify-center">
          <Brand size={30} className="text-base" />
        </div>

        {state === "done" ? (
          <div className="mt-5 text-center">
            <p className="font-medium text-green">You&apos;re on the list! ✓</p>
            <p className="mt-1 text-sm text-muted">One of our account managers will contact you shortly!</p>
          </div>
        ) : (
          <>
            <h2 className="font-display mt-5 text-center text-xl font-semibold leading-snug">
              25% off Riyada&apos;s official launch!
            </h2>
            <p className="mt-1.5 text-center text-sm text-muted">
              Leave your details and one of our account managers will contact you shortly!
            </p>

            <form onSubmit={submit} className="mt-5 space-y-2.5">
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={input}
              />
              <input
                required
                placeholder="Company name"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={input}
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={input}
              />
              <div className="flex gap-2">
                <CountryPicker iso={form.iso} onChange={(iso) => setForm({ ...form, iso })} />
                <input
                  type="tel"
                  placeholder="Mobile number (optional)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={input}
                />
              </div>
              <Button type="submit" disabled={state === "busy"} className="w-full">
                {state === "busy" ? "Sending…" : state === "error" ? "Something went wrong — retry" : "Claim my 25% off"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
